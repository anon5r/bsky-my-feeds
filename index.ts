import { FeedManager } from "./src/core/manager";
import { anonFeed } from "./src/feeds/anon";
import { db } from "./src/db";

// 環境変数の読み込み（デフォルト値付き）
const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";
const SERVICE_DID = process.env.SERVICE_DID || "did:web:example.com"; 

// アクティブなフィード定義
const activeFeeds = [
  anonFeed,
  // ここに新しいフィードを追加できます
];

/**
 * 1. XRPCサーバーの起動 (Feed Generator)
 * Blueskyからのフィード取得リクエストに応答します。
 */
console.log(`Starting XRPC Server on ${HOST}:${PORT}...`);

Bun.serve({
  port: PORT,
  hostname: HOST,
  async fetch(req) {
    const url = new URL(req.url);
    
    // フィードの投稿リストを返すエンドポイント
    if (url.pathname === "/xrpc/app.bsky.feed.getFeedSkeleton") {
       const feedUri = url.searchParams.get("feed");
       const limit = Math.min(parseInt(url.searchParams.get("limit") || "30"), 100);
       const cursor = url.searchParams.get("cursor") || undefined;
       
       if (!feedUri) return new Response("Missing feed param", { status: 400 });
       
       const feedId = feedUri.split("/").pop();
       if (!feedId) return new Response("Invalid feed param", { status: 400 });

       // DBからデータを取得
       const posts = db.getFeedSkeleton(feedId, limit, cursor);
       
       const feedItems = posts.map(p => ({ post: p.uri }));
       const nextCursor = posts.length > 0 ? posts[posts.length - 1].indexedAt : undefined;
       
       return Response.json({
         feed: feedItems,
         cursor: nextCursor
       });
    }

    // 提供しているフィードの情報を返すエンドポイント
    if (url.pathname === "/xrpc/app.bsky.feed.describeFeedGenerator") {
      const feeds = activeFeeds.map(f => ({
        uri: `at://${SERVICE_DID}/app.bsky.feed.generator/${f.id}`
      }));
      
      return Response.json({
        did: SERVICE_DID,
        feeds: feeds
      });
    }

    // DID解決用のエンドポイント (did:web の場合)
    if (url.pathname === "/.well-known/did.json") {
      return Response.json({
        "@context": ["https://www.w3.org/ns/did/v1"],
        "id": SERVICE_DID,
        "service": [
          {
            "id": "#bsky_fg",
            "type": "bsky_fg",
            "serviceEndpoint": `https://${url.hostname}`
          }
        ]
      });
    }

    return new Response("BlueSky Feed Generator Running (Bun)", { status: 200 });
  }
});


/**
 * 2. Jetstream Monitorの起動
 * 背景でBlueskyの投稿を監視し、条件に合うものをDBに保存します。
 */
const manager = new FeedManager(activeFeeds);
manager.start();
