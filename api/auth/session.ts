import { SESSION_COOKIE, getAuthConfigStatus, parseCookies, verifySession } from "../../server/auth.js";

export default {
  fetch(request: Request) {
    const status = getAuthConfigStatus();

    if (!status.enabled) {
      return Response.json({ authenticated: false, enabled: false }, { headers: { "Cache-Control": "no-store" } });
    }

    if (!status.config) {
      return Response.json(
        { authenticated: false, enabled: true, error: status.error ?? "Authentication is misconfigured." },
        { headers: { "Cache-Control": "no-store" }, status: 500 },
      );
    }

    const cookies = parseCookies(request.headers.get("cookie"));
    const session = verifySession(cookies.get(SESSION_COOKIE), status.config.cookieSecret);

    return Response.json(
      {
        authenticated: Boolean(session),
        enabled: true,
        user: session
          ? {
              avatarUrl: session.avatarUrl,
              login: session.login,
              name: session.name,
            }
          : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  },
};
