import type { Feed } from "../core/types";

// テンプレートフィードの定義
// このファイルをコピーして新しいフィードを作成してください（例: src/feeds/my_topic.ts）

const REGEX = /search_pattern/i; // ここに検索したい正規表現を記述

export const templateFeed: Feed = {
  // 一意の識別子（ログ出力などに使用）
  name: "template-feed",
  
  // フィードの説明
  description: "Template feed description",
  
  // フィルタリングロジック
  // text: 投稿本文, record: 投稿オブジェクト全体, did: ユーザーID
  // trueを返すとマッチとみなされ、ログに出力されます
  filter: (text: string, record: any, did: string) => {
    // 例: 特定のキーワードを含むかチェック
    // return text.includes("keyword");
    
    // 正規表現チェックの例
    return REGEX.test(text);
  },

  // （オプション）マッチした際の内容を整形してログに出力するための関数
  formatMatch: (text: string) => {
    const match = text.match(REGEX);
    return match ? match[0] : "Match found";
  }
};
