import { Database } from "bun:sqlite";

export class FeedDatabase {
  private db: Database;

  constructor(filename: string = "feeds.sqlite") {
    this.db = new Database(filename);
    this.init();
  }

  private init() {
    // 投稿を保存するテーブル
    // feed_name: フィードの種類（'anon-monitor'等）
    // uri: 投稿のAT-URI
    // cid: 投稿のCID
    // indexedAt: 保存日時（ソート用）
    this.db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        uri TEXT NOT NULL,
        cid TEXT NOT NULL,
        replyParent TEXT,
        replyRoot TEXT,
        indexedAt TEXT NOT NULL,
        feed_name TEXT NOT NULL,
        PRIMARY KEY (uri, feed_name)
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_posts_feed_indexed 
      ON posts (feed_name, indexedAt DESC)
    `);
  }

  /**
   * 投稿をDBに保存する
   */
  public createPost(feedName: string, post: { uri: string; cid: string; replyParent?: string; replyRoot?: string }) {
    const query = this.db.query(`
      INSERT OR IGNORE INTO posts (uri, cid, replyParent, replyRoot, indexedAt, feed_name)
      VALUES ($uri, $cid, $replyParent, $replyRoot, $indexedAt, $feed_name)
    `);

    query.run({
      $uri: post.uri,
      $cid: post.cid,
      $replyParent: post.replyParent || null,
      $replyRoot: post.replyRoot || null,
      $indexedAt: new Date().toISOString(),
      $feed_name: feedName,
    });
  }

  /**
   * フィード用のスケルトン（URIのリスト）を取得する
   */
  public getFeedSkeleton(feedName: string, limit: number = 30, cursor?: string) {
    // カーソルは indexedAt (ISO文字列) を想定
    let sql = `
      SELECT uri, indexedAt 
      FROM posts 
      WHERE feed_name = $feedName
    `;
    
    const params: any = { $feedName: feedName };

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
export const db = new FeedDatabase();
