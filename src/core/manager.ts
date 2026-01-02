import { Jetstream } from "@skyware/jetstream";
// @ts-ignore
import { CompatibleWebSocket } from "./ws_wrapper";
import type { Feed } from "./types";
import { db } from "../db";

export class FeedManager {
  private feeds: Feed[] = [];
  private jetstream: Jetstream;

  constructor(feeds: Feed[]) {
    this.feeds = feeds;
    this.jetstream = new Jetstream({
      ws: CompatibleWebSocket,
      wantedCollections: ["app.bsky.feed.post"],
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.jetstream.on("open", () => console.log("Jetstream connection opened."));
    this.jetstream.on("close", () => console.log("Jetstream connection closed."));
    this.jetstream.on("error", (err) => console.error("Jetstream error:", err));

    this.jetstream.on("commit", (event) => {
      if (event.commit.operation === "create" && event.commit.collection === "app.bsky.feed.post") {
        const record = event.commit.record as any;
        
        // テキストが存在しない場合はスキップ
        if (!record || !record.text) return;

        const text = record.text;
        const did = event.did;
        // URI構築: at://<did>/<collection>/<rkey>
        const uri = `at://${did}/${event.commit.collection}/${event.commit.rkey}`;
        const cid = event.commit.cid;

        // 登録された全フィードの条件をチェック
        for (const feed of this.feeds) {
          try {
            if (feed.filter(text, record, did)) {
              this.handleMatch(feed, text, did, uri, cid, record);
            }
          } catch (e) {
            console.error(`Error processing feed ${feed.name}:`, e);
          }
        }
      }
    });
  }

  private handleMatch(feed: Feed, text: string, did: string, uri: string, cid: string, record: any) {
    const timestamp = new Date().toISOString();
    const matchDetails = feed.formatMatch ? feed.formatMatch(text) : "Match";
    
    // DBに保存
    db.createPost(feed.name, {
      uri,
      cid,
      replyParent: record.reply?.parent?.uri,
      replyRoot: record.reply?.root?.uri
    });

    console.log(`[${timestamp}] [${feed.name}] Saved: ${matchDetails}`);
    console.log(`User: ${did}`);
    console.log(`Text: ${text.replace(/\n/g, " ")}`);
    console.log("---");
  }

  public start() {
    console.log(`Starting Feed Manager with ${this.feeds.length} feeds...`);
    this.feeds.forEach(f => console.log(` - ${f.name}: ${f.description}`));
    this.jetstream.start();
  }
}