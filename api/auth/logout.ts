import { OAUTH_STATE_COOKIE, SESSION_COOKIE, expireCookie } from "../../server/auth.js";

export default {
  fetch(request: Request) {
    const headers = new Headers({ "Cache-Control": "no-store", "Content-Type": "text/html; charset=utf-8" });
    headers.append("Set-Cookie", expireCookie(SESSION_COOKIE, request.url));
    headers.append("Set-Cookie", expireCookie(OAUTH_STATE_COOKIE, request.url, "/api/auth/callback"));

    return new Response(
      `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Signed out</title>
  </head>
  <body>
    <p>ログアウトしました。</p>
    <p><a href="/api/auth/login">もう一度ログインする</a></p>
  </body>
</html>`,
      { headers },
    );
  },
};
