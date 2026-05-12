# 工数トラッカー (Workload Tracker)

半期単位の個人工数 予実管理ツール。計画工数（人月）に対して日々の作業実績をマイクロに記録し、カテゴリ別の消化率をリアルタイムで可視化します。

- データは利用者のブラウザ localStorage に保存（バックエンド不要）
- 静的 SPA として配布、Vercel などへ 1 クリックでデプロイ
- カテゴリ・計画値は `src/constants.ts` を直接編集してカスタマイズ

## 使い始める

### A. 自分用にデプロイして使う（推奨）

1. このリポジトリをテンプレートとして自身の GitHub アカウントへコピー（GitHub の "Use this template" ボタン）。
2. コピーした repo を Vercel など静的ホスティングに接続。デフォルト設定（Vite 検出）でビルド可能。
3. 払い出された URL をブックマーク。データはその URL の localStorage に保存される。
4. （任意）`src/constants.ts` を編集し、自身の業務カテゴリ・計画工数・対象期間を設定してから push し直す。

### B. ローカルで動かす

```bash
git clone <your-fork-url>
cd workload-tracker
npm install
npm run dev
```

ブラウザで http://localhost:4649/ を開く。

## カスタマイズ

ほとんどのカスタマイズは `src/constants.ts` で完結します:

| 定数 | 内容 |
|---|---|
| `PLAN_GROUPS` | 計画グループ（予算管理単位）。`id`・表示名・人月の初期値 |
| `CATEGORIES` | 日次入力カテゴリ。`groupId` で計画グループに紐付け。1 グループに複数カテゴリ可 |
| `PLANLESS_GROUP_NAMES` | 計画値を持たない記録専用グループ名（例: 間接業務、有休） |
| `MONTHS` | 対象月の表示順 |
| `GROUP_COLORS` / `CAT_COLORS` | 配色 |

祝日は `src/utils/holidays.ts` を編集してください（初期値は 2026 年度上期の日本祝日）。

## 機能

- **日次入力**: 日付ごとにカテゴリ別の実績時間（0.25h 刻み）と作業メモ（Markdown 対応）を記録
- **予実サマリー**: グループ別の計画 vs 実績消化率、月別フィルタ、月別棒グラフ
- **履歴**: 入力済みの日付一覧、編集・削除
- **設定**: 計画工数の編集、CSV / JSON のエクスポート・インポート、全データリセット
- **週末・祝日スキップ**: 日付ナビゲーションが非稼働日を自動でスキップ

## データ保存とバックアップ

- 全データはブラウザの localStorage（`workload-tracker-data` キー）に保存
- 設定画面から **CSV** / **JSON** で随時エクスポート可能
- 別端末への移行や定期バックアップには **JSON エクスポート**（実績 + 計画 + スプレッドシート URL を 1 ファイル）を推奨
- 既存 CSV からの取り込みは設定画面のインポート機能で可能

### CSV フォーマット（参考）

RFC 4180 準拠。BOM 付き UTF-8、CRLF 改行。Google スプレッドシートや Excel に直接取り込めます。フォーマットは `data/workload.sample.csv` を参照。

## 技術スタック

- React 19 + TypeScript + Vite
- 永続化: localStorage 単独
- スタイリング: インラインスタイル（Tailwind 不使用）
- 外部 UI ライブラリ不使用

## 換算

```
1人月 = 20人日 = 160h
```

## スクリプト

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー（http://localhost:4649/） |
| `npm run build` | プロダクションビルド |
| `npm run preview` | ビルド結果プレビュー |
| `npm run lint` | ESLint |

## アーキテクチャ判断

主要な設計判断は `docs/adr/` を参照。
