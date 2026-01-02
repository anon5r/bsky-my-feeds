# Bluesky Feed Generator (Bun Edition)

BlueskyのJetstreamから特定の投稿を収集し、カスタムフィードとして配信するFeed Generatorです。
Bunランタイムを使用し、単一のプロセスで「収集（Monitor）」と「配信（XRPC Server）」の両方を効率的に行います。

## 機能

1.  **Monitor**: Jetstream (WebSocket) に接続し、正規表現で投稿をフィルタリングしてSQLiteに保存。
2.  **Generator**: `app.bsky.feed.getFeedSkeleton` リクエストに対し、保存された投稿をJSONで返却。

## 含まれるフィード

- **anon-monitor**: `anon`, `あのん` などを収集（`canon`, `anond` 等を除外）。
- **(拡張可能)**: `src/feeds/` に新しい定義を追加するだけで独自のフィードを作成可能。

## 必要要件

- Bun (v1.0.0+)
- インターネット接続 (Jetstream用)
- 公開サーバー (Feed Generatorとして公開する場合)

## 実行方法

### 環境変数

以下の環境変数を設定できます（`.env`ファイル対応は未実装ですが、コマンドラインで指定可能）。

- `PORT`: サーバーポート（デフォルト: 3000）
- `SERVICE_DID`: このサービスのDID（例: `did:web:example.com`）。Feed Generatorとして公開する際に必須。

### ローカル実行

```bash
# 依存関係インストール
bun install

# 実行
SERVICE_DID="did:web:example.com" bun run index.ts
```

起動すると、`feeds.sqlite` というデータベースファイルが生成され、データの蓄積が始まります。
同時に `http://localhost:3000` でXRPCサーバーが立ち上がります。

### Docker実行

```bash
docker build -t bsky-feed-generator .
docker run -d \
  -p 3000:3000 \
  -e SERVICE_DID="did:web:your-domain.com" \
  -v $(pwd)/data:/app/data \
  --name feed-gen \
  bsky-feed-generator
```
※ DBを永続化する場合、コンテナ内の保存先パスに合わせてボリュームマウントを調整してください（現在はカレントディレクトリに `feeds.sqlite` を作成します）。

## フィードの公開手順

1.  このサーバーをインターネット公開可能な場所にデプロイします（HTTPS必須）。
2.  `SERVICE_DID` を設定します。
3.  Bluesky公式のスクリプト等を使用して、フィードレコード（`app.bsky.feed.generator`）を公開します。
    - その際、`did` には `SERVICE_DID` を、`service` にはデプロイ先のURLを指定します。

## ライセンス

ISC
