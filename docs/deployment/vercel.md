# Vercel デプロイ手順

このアプリは Vite SPA として静的ビルドし、Vercel にそのまま配信します。バックエンド、DB、Vercel Functions、環境変数は不要です。

## 前提

- Production URL は公開前提です。
- 工数データはブラウザの localStorage に保存されます。
- localStorage は origin 単位なので、URL を変えると別データ領域になります。
- URL 変更や project rename の前には、設定画面から JSON をエクスポートしてください。

## Project Name 命名規則

Vercel の `*.vercel.app` URL は project name をもとに作られます。`vercel.app` の URL は先着順で、予約はできません。公開テンプレートから利用者ごとにデプロイする場合は、bare name を避け、短い random suffix を付けます。

推奨形式:

```text
workload-tracker-<owner-slug>-<random8>
```

例:

```text
workload-tracker-kuechi-7f3a9c2e
```

生成される主な Production URL:

```text
https://workload-tracker-kuechi-7f3a9c2e.vercel.app
```

ルール:

- `<owner-slug>` は個人名、GitHub user名、端末名など、公開してよい短い識別子にする。
- `<random8>` は 8 桁の lowercase hex を使う。
- 会社名、顧客名、案件名、内部コード、secret に近い値は入れない。
- `kosukan`、`workload-tracker`、`personal-workload-tracker` のような bare name は、個人運用インスタンスでは使わない。
- URL を短くしすぎるより、衝突しにくさと識別しやすさを優先する。

`random8` の生成例:

```bash
openssl rand -hex 4
```

UUID から切り出す場合:

```bash
node -e "console.log(crypto.randomUUID().replaceAll('-', '').slice(0, 8))"
```

## Dashboard からデプロイ

1. GitHub でこの repo を "Use this template" して、自分用 repo を作る。
2. Vercel Dashboard で `Add New...` → `Project` を選ぶ。
3. 自分用 repo を import する。
4. Project Name に命名規則どおりの名前を入れる。
5. Framework Preset が `Vite` になっていることを確認する。
6. Build and Output Settings を確認する。
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: default のままでよい。
7. Environment Variables は設定しない。
8. `Deploy` を実行する。
9. Production URL を開き、画面が表示されることを確認する。

## CLI からデプロイ

ローカルから直接デプロイする場合は Vercel CLI を使います。

```bash
npx -y vercel@latest deploy --prod
```

初回実行時の入力方針:

- `Set up and deploy ...?`: `yes`
- `Which scope should contain your project?`: 個人または運用対象の team
- `Link to existing project?`: 新規なら `no`
- `What's your project's name?`: 命名規則どおりの project name
- `In which directory is your code located?`: `./`
- `Want to modify these settings?`: 通常は `no`
- `Connect it to this project?`: Git push で自動デプロイしたい場合だけ `yes`

初回 link 後、`.vercel/` が作られます。これは project ID などのローカル設定を含むため Git 管理しません。

以後の本番デプロイ:

```bash
npx -y vercel@latest deploy --prod
```

## デプロイ後の確認

Production URL を控えたら、最低限以下を確認します。

```bash
curl -fsSI https://<project-name>.vercel.app
```

期待値:

- `HTTP/1.1 200 OK` が返る。
- トップ画面が表示される。
- 設定画面から JSON エクスポートができる。
- 日次入力後、ブラウザ再読み込みでもデータが残る。

## Git 連携

Vercel project を GitHub repo に接続すると、production branch への push で自動デプロイされます。Pull Request には preview URL が作られます。

自動デプロイを使う場合:

- production branch は `main` など 1 つに決める。
- `npm run build` と `npm run lint` が通る状態で merge する。
- project name は初回作成時に命名規則どおり決め、運用開始後は安易に変更しない。

## 料金と公開範囲

- Hobby plan は無料枠で利用できます。
- Hobby で上限を超えた場合は、課金よりも機能制限または project pause の方向になります。
- Production URL は公開です。URL を知っている人はアプリ本体を開けます。
- 入力データは各ブラウザの localStorage にあるため、他人が同じ URL を開いても自分の入力済みデータは見えません。
- Hobby plan は個人・非商用利用向けです。商用利用や大きなアクセスを想定する場合は Pro 以上を検討してください。

## 認証を付けたい場合

標準構成ではログイン機能はありません。GitHub SSO を付ける場合は、フロントエンドだけではなく、OAuth callback と session cookie を扱う小さなサーバー処理が必要です。

候補:

| 方式 | 特徴 |
| --- | --- |
| Vercel Authentication | 設定だけで使えるが、GitHub SSO ではなく Vercel account ベース。Hobby の Standard Protection では production domain は公開のまま。 |
| GitHub OAuth + Vercel Functions + Routing Middleware | GitHub account でログインできる。Vite 構成を保てる。GitHub OAuth App と Vercel Environment Variables が必要。 |
| Next.js + Auth.js | 認証実装は標準化しやすいが、現在の静的 Vite SPA からの移行コストが大きい。 |

この repo で GitHub SSO を採用する場合の推奨方針:

- 既定は公開モードのままにする。
- `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`AUTH_COOKIE_SECRET`、`AUTH_ALLOWED_GITHUB_USERS` が設定されたときだけ認証を有効化する。
- GitHub OAuth token は保存せず、認可後に署名済み HttpOnly cookie だけを保存する。
- Routing Middleware で `/api/auth/*` 以外を保護し、未ログインなら `/api/auth/login` に redirect する。
- 許可ユーザーは GitHub username allowlist から始める。GitHub org/team 判定は必要になってから追加する。

## 参考

- Vercel generated URLs: https://vercel.com/docs/deployments/generated-urls
- Vercel domains: https://vercel.com/docs/domains/working-with-domains
- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- Vercel limits: https://vercel.com/docs/limits
