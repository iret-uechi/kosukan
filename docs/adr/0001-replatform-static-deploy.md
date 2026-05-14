# ADR 0001: 静的ホスティングへのリプレイス（fork & deploy モデル）

- **Status**: Proposed
- **Date**: 2026-05-12
- **Deciders**: k-uechi
- **Branch**: `feat/replatform-static-deploy`

## Context

### 現状

- スタック: React 18 (実体は 19) + TypeScript + Vite。React SPA 一本。
- 永続化の実体: `server/csv-api.ts`（Vite custom plugin）が dev server の middleware として `/api/data`（CSV）と `/api/plans`（JSON）を受け、ローカルディスクの `data/workload.csv` / `data/plans.json` に直接 read/write。さらに `data/backups/` に世代バックアップを最大 20 件保持。
- `src/hooks/useStorage.ts` は **サーバー優先 → localStorage フォールバック** のハイブリッド。save 時は localStorage と `/api/*` の両方に書く。
- 起動方法: `npm run dev`（port 4649）。Vite dev server が止まると `/api/*` が落ちるため、データの読み書きにも常に dev server が必要。

### 問題

1. UI を触るたびに手元で `npm run dev` する必要があり、PC を開いていない時間帯に操作できない。
2. dev server を持ち歩けないので、別端末・別ネットワークから使えない。
3. 配布性がない（他者に「自分用に使ってもらう」導線がない）。
4. `CLAUDE.md` には「データ永続化: localStorage」と書いてあるが、実態はローカルファイル書き込みで、ドキュメントと実装がずれている。

### 達成したい状態

- `npm run dev` 不要で、ブラウザだけで操作できる。
- 利用者が **repo を template として利用 → デプロイ → 個人用 URL を持つ** モデル。複数人が同じ運用ルールで自分のデータを保持できる。
- 各利用者のデータは他者から見えない（少なくとも黙示的にシェアされない）。
- 既存の手元データ（`data/workload.csv` / `data/plans.json`）からの移行経路がある。
- **公開モデル**: この repo は「公開テンプレ」として再構成する。メンテナ自身の運用インスタンスは別 (private) で持つ。過去 commit に business-specific な情報が残っている可能性を考慮し、**新規 repo（新名称）に clean state から push し直す** ことを前提とする（既存履歴は引き継がない）。

## Decision drivers

- **D1. ゼロサーバー運用**: バックエンド・DB を運用したくない（個人ツールに対するオーバーキル）。
- **D2. 配布性**: README から 1 クリックで自分のインスタンスが立つこと（"Deploy to Vercel" ボタン or 同等）。
- **D3. データ分離**: 各利用者のデータが暗黙的に混ざらない。
- **D4. 移行コスト**: 現行 SPA・計算ロジック・UI 構造は流用したい。
- **D5. ベンダーロックインの低さ**: Vercel 固有機能への依存を必要最低限に。
- **D6. クロスデバイスは "あれば嬉しい" 程度**: 初期は単一ブラウザでよい。バックアップ手段だけ確保する。

## Options

### O1. Vite SPA をそのまま静的ビルド → Vercel 静的デプロイ（**推奨**）

- 構成変更を最小化。`server/csv-api.ts` への依存を切り、ストレージは localStorage 単独運用に倒す。
- `useStorage` から `/api/*` ブランチを削除、または `import.meta.env.DEV` 限定にする。
- JSON エクスポート（ダウンロード）/ インポートを追加して、ローカル `data/workload.csv` から移行できる導線と、利用者が能動的にバックアップ取得できる導線を確保。
- ホストは Vercel の "Import Git Repository" でフォークから直接プロビジョン。各利用者の fork から `*.vercel.app` URL が払い出される。
- **pros**: 変更面積が小さい。CSV/Plans の計算・型・UI を一切触らない。ベンダーロックも最小（Cloudflare Pages や Netlify でも動く）。
- **cons**: SSR/SSG 由来の機能（OGP、検索性）は弱い。複数ページ構造の拡張がしにくい。

### O2. Astro + React islands に乗せ替え → Vercel デプロイ

- Astro のレイアウト下に既存 React 機能を island として配置。
- ストレージ取り扱いは O1 と同じ（localStorage + export/import）。
- **pros**: 将来 README/操作マニュアル/設計メモを MDX で同居させやすい。islands で初期ロード軽い。
- **cons**: 今は単機能 SPA で複数ページ価値がない。Astro Vite config と React 19 のミックスで詰まりリスク。投資対効果が今は小さい。

### O3. Next.js + Vercel KV/Postgres + Auth（GitHub OAuth 等）

- 真のマルチデバイス・マルチユーザー。
- **pros**: クロスデバイス同期、本物のユーザー管理。
- **cons**: 個人ツールに対しオーバーキル。Vercel ロックインが強い。無料枠の上限と運用コストが発生。D1 に反する。

### O4. File System Access API でローカルディレクトリに直書き

- ブラウザから利用者が選んだフォルダに JSON/CSV を直書き。
- **pros**: 既存のファイル形式・バックアップフォルダの感覚を維持。
- **cons**: Chrome/Edge のみで Safari/Firefox 非対応。fork & deploy モデルの "URL アクセスだけで使える" 簡潔さを壊す。

## Decision（提案）

**O1（Vite SPA → Vercel 静的デプロイ）を採用する。** 永続化は localStorage 単独 + JSON エクスポート/インポート。Astro 化（O2）は将来 README/解説の同居が必要になった時点で再検討。

### 利用者フロー（採用後の想定）

1. 利用者がこの repo を **fork**。
2. README の "Deploy to Vercel" ボタン or Vercel ダッシュボードから fork を import。
3. Vercel project name は `workload-tracker-<owner-slug>-<random8>` 形式で作る。ビルド設定はデフォルト（Vite 自動検出）。デプロイ完了で `<project-name>.vercel.app` 等の個人 URL が払い出される。
4. その URL を開く → ブラウザの localStorage（その URL スコープ）に予実が貯まる。
5. バックアップ: 設定画面の「エクスポート」ボタンで JSON を手元にダウンロード。復元は「インポート」から。

### Vercel project name / URL convention

- Vercel の `*.vercel.app` URL は project name をもとに割り当てられ、先着順で予約できない。
- 生成 URL にも project name が含まれるため、公開テンプレートの利用者には bare name を使わせない。
- 推奨 project name は `workload-tracker-<owner-slug>-<random8>`。
- `<random8>` は `openssl rand -hex 4` などで作る 8 桁 lowercase hex とする。
- 会社名、顧客名、案件名、内部コード、secret に近い値は入れない。
- URL 変更は localStorage の origin 変更を伴うため、運用開始後の rename は JSON エクスポート後に行う。

### データ分離

- localStorage は origin スコープなので、各利用者の `*.vercel.app` URL ごとに分離。
- 他者が同じ URL を開けば同じデータが見える点には注意（URL を共有しない運用）。プライベートにしたいなら Vercel プロジェクトの Password Protection（Pro 機能）か、後述 Future work を参照。

## Separation strategy（公開と個人運用の分離）

分離対象を 3 レイヤに分けて扱う。

| レイヤ | 対象 | 解決策 |
| --- | --- | --- |
| L1. 日次データ | 工数実績・計画値 | O1 の localStorage 化で **repo にデータファイルが存在しない** 状態にする（構造的解決） |
| L2. 業務固有 config | `src/constants.ts` の `PLAN_GROUPS`、`src/utils/holidays.ts`、`CLAUDE.md` の業務内訳記述、`package.json` の旧 tracker 名称 | 短期: generic 化 + `src/constants.local.ts`（gitignore）で override / 長期: UI 編集化 |
| L3. 個人インスタンス URL | メンテナ自身の運用先 | 公開 repo とは別に、template から立てる private インスタンスを別途デプロイ（同タイミングで作成する） |

### L2 棚卸し対象（再公開前に generic 化する候補）

- `src/constants.ts` — `PLAN_GROUPS` 内の固有カテゴリ名・業務分類
- `src/utils/holidays.ts` — 独自休業日が含まれているか確認
- `CLAUDE.md` — 具体的なプロジェクト名やサービス分類
- `README.md` — 個人/組織を特定できる記述
- `package.json` の `name`、`index.html` の `<title>`（"FY26 上期" は generic に置換するか検討）
- `.env.example` の参考 URL / コメント
- `data/workload.sample.csv` — sample データに実値が混ざっていないか

### Template 機能と保護設定

- 再公開時に GitHub の **Template repository** を ON にする。利用者は "Use this template" で fresh repo を作る（fork ではない）。
- main への直 push 禁止、PR 必須の branch protection を有効化。
- `gitleaks` を GitHub Actions に組み込み、secret / 個人情報パターンの混入を CI でブロック。



### 削除・変更されるもの

- `server/csv-api.ts` を削除。Vite plugin 登録（`vite.config.ts`）からも外す。
- `data/workload.csv` `data/plans.json` `data/backups/` は repo から外す（gitignore 化、または fork 後の移行ガイドに従い手動で利用者が JSON 化して import）。
- `src/hooks/useStorage.ts` から `/api/*` 経路を削除（または dev-only オプション化）。
- `CLAUDE.md` の永続化記述を実態に合わせて更新。

### 追加されるもの

- `src/components/Settings.tsx` 等に「エクスポート（JSON ダウンロード）」「インポート（JSON 読込）」を追加。
- 既存 `data/workload.csv` から localStorage へワンショット移行できる CLI または import 機能（CSV 受付）。
- README に Deploy to Vercel ボタン、利用者ガイド、データバックアップ手順を追記。
- 任意: `vercel.json`（SPA fallback。Vite なら通常不要だが念のため明示）。

### リスクと緩和

| リスク | 緩和策 |
| --- | --- |
| localStorage 容量上限（〜5MB）に当たる | 現行データ規模（半期分の日次エントリ）から見て当面非現実的。エクスポート定期化を運用ルール化。 |
| ブラウザ初期化・別端末で消失 | 「エクスポートボタン」常設 + 設定画面の警告。Future work で同期化を検討。 |
| 既存利用者の手元データ消失 | リプレイス前に `data/workload.csv` を JSON 化してエクスポートする手順を README に書く。 |
| Vercel 障害時のアクセス断 | 静的ファイルなのでミラー（GitHub Pages 等）を簡単に立てられる。重大ではない。 |
| URL を知っている第三者にデータが見える | 利用者ガイドで「Vercel プロジェクトを Private にする / URL を共有しない」を明記。必要に応じ Vercel Password Protection。 |

## Migration plan（実装タスク粒度）

### Phase 1: 理想挙動の実装（このブランチで完結）

1. Settings タブに **エクスポート（JSON ダウンロード）** を追加。既存データのバックアップ手段を先に確保。
2. Settings タブに **インポート（JSON）** と **旧 CSV インポート**（`data/workload.csv` 互換）を追加。これで手元 CSV を localStorage へ移行できる。
3. `useStorage` から `/api/*` 経路を削除（または `import.meta.env.DEV` ガード）。localStorage 単独運用へ。
4. `server/csv-api.ts` 削除、`vite.config.ts` のプラグイン登録解除。
5. `data/` を `.gitignore` 完全対象に（sample を残す場合は `data/workload.sample.csv` のみ）。
6. ローカルで動作確認（`npm run dev` で起動 → エクスポート / インポート / 日次入力 / 計画編集 / 月別フィルタが期待通り）。

### Phase 2: 公開準備（同ブランチ続行 or 別ブランチ）

7. L2 棚卸しを実施し、`src/constants.local.ts` override 機構を実装（generic default + ローカル上書き）。
8. `CLAUDE.md` / `README.md` を generic 化し、`package.json` `name` を public 向けに改名。
9. `README.md` に Deploy to Vercel ボタン、"Use this template" 手順、Vercel project name 命名規則、バックアップ運用、ライセンス、貢献ガイドを記載。
10. `vercel.json`（必要なら SPA fallback）と、`gitleaks` GitHub Actions を追加。

### Phase 3: 再公開（新規 repo 作成と切替）

11. 新規 GitHub repo を新名称で作成（履歴を引き継がない）。詳細は次節。
12. Template repository / branch protection を有効化。
13. 新 repo を Vercel に接続してデプロイ。
14. **同タイミングで**、メンテナ用 private インスタンスを "Use this template" 経由で別 repo として作成し、自分用カテゴリを `src/constants.local.ts`（or Vercel env）で注入してデプロイ。
15. 旧 repo（現 `kosukan`）はローカルにアーカイブ、または private 化して保存。

## Republication to a fresh repository

### Why

- 既存 commit 履歴に business-specific な情報（過去の `data/workload.csv` 内容や、commit message に現れる具体名）が残っている可能性がある（commit `41012e7` が「sensitive data を gitignore に移した」ことを示しており、それ以前のコミットには実データが含まれていたと推定される）。
- `git filter-repo` / BFG による履歴 scrub は、見落としリスクと検証コストが高い（force-push 後の rewrite も不可逆）。
- 個人ツール段階で履歴保存の重要度が低く、**clean state からの単一 initial commit のほうが安全で安価**。

### How

1. Phase 1〜2 を本ブランチで完了させ、main にマージ（または本ブランチで完了状態を作る）。
2. `tmp/public-export/` のような作業ディレクトリに、`.git` 抜きで現状ツリーをコピー。
3. `git init` して single initial commit（`feat: initial public release`）。
4. 新 GitHub repo（新名称）を作成、`git remote add origin ...` → `git push -u origin main`。
5. Template repository / branch protection / gitleaks Actions を有効化。
6. Vercel に接続、デプロイ確認。
7. 旧 `kosukan` repo はローカルバックアップを取ったうえで GitHub 側を private 化 or archive 化（即時削除はしない、念のため）。

### 新 repo 名（暫定案）

未決。候補方向としては:
- 機能ベース: `workload-tracker` / `personal-workload-tracker` / `effort-budget-tracker`
- 半期非依存に: 現在の `fy26h1-tracker`（package.json）と `kosukan`（git repo）は両方とも generic 化対象。



## Future work（今回はやらない）

- クロスデバイス同期: 各利用者が個別に Vercel KV を有効化する分岐（KV 環境変数が入っていれば KV 永続化、無ければ localStorage）。
- GitHub Gist / 自フォークへ commit-back する形のクラウドバックアップ。
- 解説ページ・運用 wiki を同居させたくなったら Astro 化を再評価（O2）。

## Open questions

- 新 repo 名（暫定案は上記）。
- ライセンス（MIT / Apache-2.0 / その他）。Deploy to Vercel ボタンを README に置く前に確定が必要。
- 公開タイミング（Phase 1〜2 完了 → 新規 repo 作成 → public 化、の境目をいつ引くか）。
- 旧 `kosukan` repo の扱い（private 化 / archive / 削除）。
- 各利用者の Vercel デプロイを Public 前提とするか、Password Protection 推奨で運用するか。

### 解決済み（このセッションで合意）

- 過去履歴の sensitive data 残存 → **新規 repo を clean state で立て直す** ことで対応（履歴 scrub は採用しない）。
- メンテナ自身の運用インスタンス → 公開 repo とは別に、**再公開と同タイミングで** private "Use this template" インスタンスを作成。
