import { Jetstream } from "@skyware/jetstream";
// @ts-ignore
import { CompatibleWebSocket } from "./ws_wrapper";
import type {Feed} from "./types";

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

        // 登録された全フィードの条件をチェック
        for (const feed of this.feeds) {
          try {
            if (feed.filter(text, record, did)) {
              this.logMatch(feed, text, did);
            }
          } catch (e) {
            console.error(`Error processing feed ${feed.name}:`, e);
          }
        }
      }
    });
  }

  private logMatch(feed: Feed, text: string, did: string) {
    const timestamp = new Date().toISOString();
    const matchDetails = feed.formatMatch ? feed.formatMatch(text) : "Match";
    
    console.log(`[${timestamp}] [${feed.name}] Found: ${matchDetails}`);
    console.log(`User: ${did}`);
    console.log(`Text: ${text.replace(/\n/g, " ")}`); // 改行をスペースに置換して1行表示
    console.log("---");
  }

  public start() {
    console.log(`Starting Feed Manager with ${this.feeds.length} feeds...`);
    this.feeds.forEach(f => console.log(` - ${f.name}: ${f.description}`));
    this.jetstream.start();
  }
}
