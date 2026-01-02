# Bluesky Feed Monitor Base

BlueskyのJetstream（Firehose）に接続し、複数の抽出ルールに基づいて投稿をリアルタイムで監視・フィルタリングするための汎用基盤です。
Bunランタイムを使用しており、高速かつ低遅延で動作します。

デフォルトで `template.ts` が含まれています。
これをテンプレートとして独自のフィードルールを簡単に追加・運用できるように設計されています。

## 特徴

- **マルチフィード対応**: 1つの接続で複数の異なる抽出ルールを同時に稼働可能。
- **モジュール構造**: `src/feeds/` にファイルを追加するだけで新しい監視対象を追加可能。
- **高速動作**: Bun + WebSocketによる軽量実装。
- **コンテナ対応**: Dockerでの運用を標準サポート。

## 新しいフィードの作り方

1. **テンプレートをコピー**:
   `src/feeds/template.ts` をコピーして、任意の名前（例: `src/feeds/crypto.ts`）で保存します。

2. **ロジックの実装**:
   `filter` 関数内に抽出条件（正規表現やキーワード判定）を記述します。

   ```typescript
   export const cryptoFeed: Feed = {
     name: "crypto-watch",
     description: "Watches for crypto currencies",
     filter: (text) => /bitcoin|eth/i.test(text)
   };
   ```

3. **登録**:
   `index.ts` を開き、作成したフィードをインポートして `activeFeeds` 配列に追加します。

   ```typescript
   import { cryptoFeed } from "./src/feeds/crypto";

   const activeFeeds = [
     anonFeed,
     cryptoFeed, // 追加
   ];
   ```

## 実行方法

### ローカル実行

```bash
bun install
bun run index.ts
```

### Docker実行

```bash
docker build -t bsky-feed-monitor .
docker run -d --name bsky-feed bsky-feed-monitor
```

## 将来の拡張（Feed Generator化）

現在、本ツールは「監視ログ」を出力するクライアントとして動作します。
Bluesky上の「カスタムフィード」として公開する場合、`src/core/manager.ts` 内の `logMatch` 部分を拡張し、マッチした投稿のURIをデータベース（SQLite/PostgreSQL等）に保存する処理を追加してください。その後、保存されたデータを返すXRPCサーバーを実装することでFeed Generatorとして機能します。

## ライセンス

ISC