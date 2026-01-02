import { FeedManager } from "./src/core/manager";
import { anonFeed } from "./src/feeds/anon";

// ここに新しいフィードを追加できます
const activeFeeds = [
  anonFeed,
];

const manager = new FeedManager(activeFeeds);
manager.start();
