# CLAUDE.md

## プロジェクト概要
個人の工数予実管理ツール。FY26上期（2026年4月〜9月）のタスク別計画工数に対して
日次の作業実績を記録し、消化率を可視化する。

## ブランチ戦略
GitHub Flow を使用する

## 技術スタック
- React 18 + TypeScript + Vite
- データ永続化: localStorage（バックエンド不要）
- スタイリング: CSS Modules またはインラインスタイル（Tailwind不使用）

## 開発コマンド
- `npm run dev` — 開発サーバー起動
- `npm run build` — プロダクションビルド
- `npm run preview` — ビルド結果プレビュー

## ディレクトリ構造
- `src/components/` — UI コンポーネント（タブごとに分割）
- `src/hooks/` — カスタム hooks（useStorage）
- `src/utils/` — 日付・計算ユーティリティ
- `src/types.ts` — 型定義
- `src/constants.ts` — カテゴリ・月・色の定義

## 重要な設計判断
- 入力単位は時間（h）、表示単位は人日（÷8h）
- 0.25h 刻みで入力可能
- onChange で即時保存（デバウンスなし）
- 計画値0かつ実績値0のカテゴリはサマリーで非表示
- 月別フィルタ時の計画値は上期計画 ÷ 6 で均等按分

## コーディング規約
- コンポーネントは関数コンポーネント + hooks
- 状態管理は useState / useReducer（状態管理ライブラリ不使用）
- 外部UIライブラリ不使用
- 日本語UIテキストはコンポーネント内に直書き（i18n不要）
