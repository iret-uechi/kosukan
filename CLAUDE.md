# CLAUDE.md

## プロジェクト概要
個人の工数予実管理ツール。半期単位のタスク別計画工数に対して日次の作業実績を記録し、消化率を可視化する。
公開リポジトリではテンプレ既定値（プロジェクトA/B/C + 運用業務 など）を入れている。fork 後、デプロイ先へ反映したいカテゴリは `src/constants.ts` を書き換える。ローカルだけで試す値は `src/constants.local.example.ts` を `src/constants.local.ts` にコピーして override できる（`src/constants.local.ts` は git 管理外）。

## ブランチ戦略
GitHub Flow を使用する

## 技術スタック
- React 19 + TypeScript + Vite
- データ永続化: localStorage 単独（バックエンド不要、静的デプロイ可）
- スタイリング: CSS Modules またはインラインスタイル（Tailwind不使用）

## デプロイモデル
- 静的 SPA として配布。Vercel など静的ホスティングに乗せる前提。
- 利用者は repo を template として使い、自分の URL にデプロイして利用する。
- 各利用者のデータは、それぞれの origin の localStorage に保持される（サーバー共有なし）。

## 開発コマンド
- `npm run dev` — 開発サーバー起動（ポート 4649）
- `npm run build` — プロダクションビルド
- `npm run preview` — ビルド結果プレビュー
- `npm run lint` — ESLint 実行

## ディレクトリ構造
- `src/components/` — UI コンポーネント（タブごとに分割）
- `src/hooks/` — カスタム hooks（useStorage）
- `src/utils/` — 日付・計算ユーティリティ、CSV/JSON ポータビリティ（backup.ts）
- `src/types.ts` — 型定義
- `src/constants.ts` — テンプレ既定のカテゴリ・月・色の定義
- `src/constants.local.example.ts` — git 管理外 override 用サンプル
- `docs/adr/` — Architecture Decision Records

## 重要な設計判断
- 2層構造: PlanGroup（予算管理単位）と Category（日次入力単位）
- 計画値は人月単位（1人月=20人日=160h）
- 入力単位は時間（h）、内部変換: h → 人日(÷8) → 人月(÷20)
- 0.25h 刻みで入力可能
- onChange で即時保存（デバウンスなし）
- 計画値0かつ実績0のグループはサマリーで非表示
- 月別フィルタ時の計画値は上期計画 ÷ 6 で均等按分
- 1グループに複数カテゴリ（サブカテゴリ）を持たせる構造をサポート（例: 運用業務をサブカテゴリで分割）
- 計画値を持たない記録専用グループ（間接業務 / 有休 など）は `PLANLESS_GROUP_NAMES` で定義
- 自分用のカテゴリ・計画値・対象月・配色は `src/constants.local.ts` が存在する場合に優先される

## コーディング規約
- コンポーネントは関数コンポーネント + hooks
- 状態管理は useState / useReducer（状態管理ライブラリ不使用）
- 外部UIライブラリ不使用
- 日本語UIテキストはコンポーネント内に直書き（i18n不要）
