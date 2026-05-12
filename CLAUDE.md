# CLAUDE.md

## プロジェクト概要
個人の工数予実管理ツール。FY26上期（2026年4月〜9月）のタスク別計画工数に対して
日次の作業実績を記録し、消化率を可視化する。

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
- `src/constants.ts` — カテゴリ・月・色の定義
- `docs/adr/` — Architecture Decision Records

## 重要な設計判断
- 2層構造: PlanGroup（予算管理単位）と Category（日次入力単位）
- 計画値は人月単位（1人月=20人日=160h）
- 入力単位は時間（h）、内部変換: h → 人日(÷8) → 人月(÷20)
- 0.25h 刻みで入力可能
- onChange で即時保存（デバウンスなし）
- 計画値0かつ実績0のグループはサマリーで非表示
- 月別フィルタ時の計画値は上期計画 ÷ 6 で均等按分
- 運用保守は計画1本だが、入力時にサービス別（Abuse/AMS/メール通知/ExtMon/その他）を選択
- 有休は計画外カテゴリとして記録のみ

## コーディング規約
- コンポーネントは関数コンポーネント + hooks
- 状態管理は useState / useReducer（状態管理ライブラリ不使用）
- 外部UIライブラリ不使用
- 日本語UIテキストはコンポーネント内に直書き（i18n不要）
