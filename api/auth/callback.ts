import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  createCookie,
  createSession,
  expireCookie,
  getAuthConfigStatus,
  getSessionMaxAgeSeconds,
  parseCookies,
} from "../../server/auth.js";

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  avatar_url?: string;
  id?: number;
  login?: string;
  name?: string | null;
}

export default {
  async fetch(request: Request) {
    const status = getAuthConfigStatus();
    const url = new URL(request.url);

    if (!status.enabled) {
      return Response.redirect(new URL("/", url), 302);
    }

    if (!status.config) {
      return new Response(status.error ?? "Authentication is misconfigured.", { status: 500 });
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookies = parseCookies(request.headers.get("cookie"));
    const expectedState = cookies.get(OAUTH_STATE_COOKIE);

    if (!code || !state || !expectedState || state !== expectedState) {
      return new Response("Invalid OAuth state.", { status: 400 });
    }

    const tokenResponse = await exchangeCodeForToken(code, status.config.clientId, status.config.clientSecret);
    if (!tokenResponse.access_token) {
      return new Response(tokenResponse.error_description ?? tokenResponse.error ?? "GitHub OAuth failed.", {
        status: 401,
      });
    }

    const user = await fetchGitHubUser(tokenResponse.access_token);
    if (!user.login || !user.id) {
      return new Response("GitHub user response was incomplete.", { status: 401 });
    }

    const login = user.login.toLowerCase();
    if (!status.config.allowedUsers.has(login)) {
      return new Response("This GitHub user is not allowed to access this app.", { status: 403 });
    }

    const session = createSession(
      {
        avatarUrl: user.avatar_url,
        id: user.id,
        login,
        name: user.name ?? undefined,
      },
      status.config.cookieSecret,
    );

    const headers = new Headers({ "Cache-Control": "no-store", Location: "/" });
    headers.append("Set-Cookie", createCookie(SESSION_COOKIE, session, request.url, getSessionMaxAgeSeconds()));
    headers.append("Set-Cookie", expireCookie(OAUTH_STATE_COOKIE, request.url, "/api/auth/callback"));

    return new Response(null, { status: 302, headers });
  },
};

async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
): Promise<GitHubTokenResponse> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  return response.json() as Promise<GitHubTokenResponse>;
}

async function fetchGitHubUser(accessToken: string): Promise<GitHubUserResponse> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "kosukan-workload-tracker",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    return {};
  }

  return response.json() as Promise<GitHubUserResponse>;
}
