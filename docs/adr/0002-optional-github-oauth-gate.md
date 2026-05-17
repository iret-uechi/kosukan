# ADR 0002: Optional GitHub OAuth gate for private instances

- **Status**: Accepted
- **Date**: 2026-05-14
- **Deciders**: k-uechi

## Context

ADR 0001 では、このアプリを Vite SPA として Vercel に静的デプロイし、Production URL は公開前提とした。入力データは localStorage に保存されるため、同じ URL を他者が開いても、利用者本人のブラウザ内データは見えない。

一方で、個人運用インスタンスでは「アプリ本体も自分だけが開ける」状態にしたい場合がある。特に公開テンプレート化後は、利用者ごとに GitHub account で認証できると自然である。

## Decision drivers

- Vite SPA の構成をできるだけ維持する。
- GitHub account でログインできるようにする。
- secret をフロントエンド bundle に入れない。
- 公開テンプレートとして、認証なしでも使える状態を維持する。
- 個人利用の Hobby plan で過剰な運用コストを増やさない。

## Options

### O1. 公開 URL のまま運用する

- **pros**: 現状維持。静的ホスティングだけで完結する。最も壊れにくい。
- **cons**: URL を知っている人はアプリ本体を開ける。

### O2. Vercel Authentication を使う

- **pros**: アプリ実装を変えずに Vercel 側で保護できる。
- **cons**: GitHub SSO ではなく Vercel account ベース。Hobby の Standard Protection では production domain は公開のまま。production domain まで完全に保護するには plan / protection scope の制約がある。

### O3. GitHub OAuth + Vercel Functions + Routing Middleware

- GitHub OAuth App を作り、Vercel Functions で OAuth callback と session cookie を扱う。
- Routing Middleware で未ログイン request を `/api/auth/login` に redirect する。
- 許可ユーザーは `AUTH_ALLOWED_GITHUB_USERS` の allowlist で判定する。
- **pros**: GitHub account でログインできる。Vite SPA を維持できる。認証を optional にできる。
- **cons**: 完全な静的配信ではなくなる。Vercel Functions / Routing Middleware の利用枠を消費する。GitHub OAuth App と secret 管理が必要。

### O4. Next.js + Auth.js へ移行する

- **pros**: Web app の認証としては標準的な構成に寄せやすい。
- **cons**: 現在の目的に対して移行コストが大きい。Vite SPA の単純さを失う。

## Decision

既定は O1 の公開 URL 運用を維持する。ログインが必要な個人インスタンス向けには、O3（GitHub OAuth + Vercel Functions + Routing Middleware）を optional feature として追加する。

認証は、以下の environment variables がすべて設定された場合だけ有効化する。

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `AUTH_COOKIE_SECRET`
- `AUTH_ALLOWED_GITHUB_USERS`

認証関連 environment variable が一部だけ設定された場合は、誤って公開に戻さず fail closed として 500 error を返す。

## Consequences

- 公開テンプレートとしては、環境変数なしで従来どおり動作する。
- 認証有効時は Vercel Functions と Routing Middleware が必要になる。
- GitHub OAuth token は保存しない。ログイン後は署名済み HttpOnly cookie で session を表現する。
- user allowlist 方式から始める。org / team membership 判定は、必要になってから `read:org` scope を追加して検討する。
- URL を変更すると localStorage origin が変わるため、認証導入や project rename の前後では JSON export/import 手順を案内する。
- SSO と HTTPS は通信経路と未認証アクセスの保護であり、localStorage を secret store に変えるものではない。

## Implementation sketch

1. `api/auth/login` で GitHub OAuth authorize URL へ redirect する。
2. `api/auth/callback` で authorization code を access token に交換し、GitHub user を取得する。
3. `AUTH_ALLOWED_GITHUB_USERS` に含まれる username だけ許可する。
4. 許可された user には署名済み HttpOnly cookie をセットする。
5. `api/auth/logout` で cookie を削除する。
6. `middleware.ts` で `/api/auth/*` と静的 health path 以外を保護する。

## Implementation

- `server/auth.ts`: auth environment variable validation、HMAC signed session cookie、cookie parsing。
- `api/auth/login.ts`: GitHub OAuth authorize redirect と state cookie 発行。
- `api/auth/callback.ts`: authorization code exchange、GitHub user 取得、allowlist 判定、session cookie 発行。
- `api/auth/logout.ts`: session cookie と OAuth state cookie の削除。
- `api/auth/session.ts`: Header 表示用の現在 session 取得。
- `middleware.ts`: 認証有効時に `/api/auth/*` 以外を保護。
- `src/components/AuthStatus.tsx`: 認証有効時のみ GitHub username と logout link を表示。

## Security notes

- `GITHUB_CLIENT_SECRET` と `AUTH_COOKIE_SECRET` は Vercel Environment Variables にだけ保存する。
- GitHub OAuth access token は session に保存しない。
- session cookie は HttpOnly、SameSite=Lax、HTTPS では Secure 属性を付ける。
- localStorage は端末内の保存領域であり、XSS、共有端末、ブラウザ同期、端末侵害への保護境界ではない。

## References

- GitHub OAuth web application flow: https://docs.github.com/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- Vercel Functions with Vite: https://vercel.com/docs/frameworks/frontend/vite
- Vercel Routing Middleware: https://vercel.com/docs/routing-middleware/api
- Vercel Deployment Protection: https://vercel.com/docs/deployment-protection
