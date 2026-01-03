import { Database } from "bun:sqlite";

export class FeedDatabase {
  private db: Database;

  constructor(filename: string = "feeds.sqlite") {
    this.db = new Database(filename);
    this.init();
  }

  private init() {
    // 1. 新しいスキーマでテーブルを作成（存在しない場合）
    this.db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        uri TEXT NOT NULL,
        cid TEXT NOT NULL,
        replyParent TEXT,
        replyRoot TEXT,
        indexedAt TEXT NOT NULL,
        feed_id TEXT NOT NULL,
        PRIMARY KEY (uri, feed_id)
      )
    `);

    // 2. マイグレーション: 古いカラム（feed_name）のみのテーブルからの移行チェック
    try {
      // 既存のテーブル構造を確認
      const tableInfo = this.db.query("PRAGMA table_info(posts)").all() as any[];
      const hasFeedId = tableInfo.some(col => col.name === 'feed_id');
      const hasFeedName = tableInfo.some(col => col.name === 'feed_name');

      if (!hasFeedId && hasFeedName) {
        console.log("Migrating database from feed_name to feed_id...");
        
        // トランザクション開始
        this.db.run("BEGIN TRANSACTION");
        
        // A. 古いテーブルをリネーム
        this.db.run("ALTER TABLE posts RENAME TO posts_old");
        
        // B. 新しいテーブルを作成
        this.db.run(`
          CREATE TABLE posts (
            uri TEXT NOT NULL,
            cid TEXT NOT NULL,
            replyParent TEXT,
            replyRoot TEXT,
            indexedAt TEXT NOT NULL,
            feed_id TEXT NOT NULL,
            PRIMARY KEY (uri, feed_id)
          )
        `);
        
        // C. データを移行 (feed_name -> feed_id)
        this.db.run(`
          INSERT INTO posts (uri, cid, replyParent, replyRoot, indexedAt, feed_id)
          SELECT uri, cid, replyParent, replyRoot, indexedAt, feed_name FROM posts_old
        `);
        
        // D. 古いテーブルを削除
        this.db.run("DROP TABLE posts_old");
        
        this.db.run("COMMIT");
        console.log("Migration completed.");
      }
    } catch (e) {
      console.error("Migration failed:", e);
      try { this.db.run("ROLLBACK"); } catch (_) {}
    }

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_posts_feed_indexed 
      ON posts (feed_id, indexedAt DESC)
    `);
  }

  /**
   * 投稿をDBに保存する
   */
  public createPost(feedId: string, post: { uri: string; cid: string; replyParent?: string; replyRoot?: string }) {
    const query = this.db.query(`
      INSERT OR IGNORE INTO posts (uri, cid, replyParent, replyRoot, indexedAt, feed_id)
      VALUES ($uri, $cid, $replyParent, $replyRoot, $indexedAt, $feedId)
    `);

    query.run({
      $uri: post.uri,
      $cid: post.cid,
      $replyParent: post.replyParent || null,
      $replyRoot: post.replyRoot || null,
      $indexedAt: new Date().toISOString(),
      $feedId: feedId,
    });
  }

  /**
   * フィード用のスケルトン（URIのリスト）を取得する
   */
  public getFeedSkeleton(feedId: string, limit: number = 30, cursor?: string) {
    // カーソルは indexedAt (ISO文字列) を想定
    let sql = `
      SELECT uri, indexedAt 
      FROM posts 
      WHERE feed_id = $feedId
    `;
    
    const params: any = { $feedId: feedId };

    if (cursor) {
      sql += ` AND indexedAt < $cursor`;
      params.$cursor = cursor;
    }

    sql += ` ORDER BY indexedAt DESC LIMIT $limit`;
    params.$limit = limit;

    const posts = this.db.query(sql).all(params) as { uri: string; indexedAt: string }[];
    
    return posts;
  }
}

// シングルトンとしてエクスポート（簡易化のため）
const dbPath = process.env.DB_PATH || "feeds.sqlite";
export const db = new FeedDatabase(dbPath);