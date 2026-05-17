import { next } from "@vercel/functions";
import { SESSION_COOKIE, getAuthConfigStatus, parseCookies, verifySession } from "./server/auth.js";

export const config = {
  matcher: ["/((?!api/auth).*)"],
  runtime: "nodejs",
};

export default function middleware(request: Request) {
  const status = getAuthConfigStatus();

  if (!status.enabled) {
    return next();
  }

  if (!status.config) {
    return new Response(status.error ?? "Authentication is misconfigured.", { status: 500 });
  }

  const cookies = parseCookies(request.headers.get("cookie"));
  const session = verifySession(cookies.get(SESSION_COOKIE), status.config.cookieSecret);

  if (session) {
    return next();
  }

  return Response.redirect(new URL("/api/auth/login", request.url), 302);
}
