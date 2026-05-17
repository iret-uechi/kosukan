import {
  OAUTH_STATE_COOKIE,
  createCookie,
  createRandomState,
  getAuthConfigStatus,
} from "../../server/auth.js";

export default {
  fetch(request: Request) {
    const status = getAuthConfigStatus();
    const url = new URL(request.url);

    if (!status.enabled) {
      return Response.redirect(new URL("/", url), 302);
    }

    if (!status.config) {
      return new Response(status.error ?? "Authentication is misconfigured.", { status: 500 });
    }

    const state = createRandomState();
    const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
    authorizeUrl.searchParams.set("client_id", status.config.clientId);
    authorizeUrl.searchParams.set("scope", "read:user");
    authorizeUrl.searchParams.set("state", state);

    return new Response(null, {
      status: 302,
      headers: {
        "Cache-Control": "no-store",
        Location: authorizeUrl.toString(),
        "Set-Cookie": createCookie(OAUTH_STATE_COOKIE, state, request.url, 600, "/api/auth/callback"),
      },
    });
  },
};
