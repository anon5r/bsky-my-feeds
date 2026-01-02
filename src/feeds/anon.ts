import type {Feed} from "../core/types";

/**
 * 正規表現の解説:
 * 
 * 1. 英語パート: (?<![a-zA-Z0-9])anon(?:5r(?:\.com)?|さん)?(?![a-zA-Z0-9])
 *    - (?<![a-zA-Z0-9]): 前に英数字がないこと（canon, Manonなどを除外）
 *    - anon(?:5r(?:\.com)?|さん)?: 対象キーワードと許可された接尾辞
 *    - (?![a-zA-Z0-9]): 後ろに英数字がないこと（anond, anon123などを除外）
 * 
 * 2. 日本語パート: (?<![あ-ん])あの...
 *    - (?<![あ-ん]): 直前に濁音を含まないひらがながないこと（とりあのん、まあのんびり、きゃのん除外）
 */
const REGEX = /(?<![a-zA-Z0-9])anon(?:5r(?:\.com)?|さん)?(?![a-zA-Z0-9])|(?<![あ-ん])あの(?:ん(?:さん|ちゃん)?|くん|ちゃん)/gu;

// 正規表現以外で除外したい特定のフレーズがあればここに追加
const IGNORE_PHRASES = [
  "まあのんびり", // 正規表現の (?<!ま) でカバーされますが、念のため例として記載
];

export const anonFeed: Feed = {
  name: 'call my name',
  description: '名前言及補足用',
  
  filter: (text: string) => {
    // 1. 正規表現チェック
    const matches = text.match(REGEX);
    if (!matches) return false;

    // 2. 追加のブラックリストチェック（必要に応じて）
    // マッチしたとしても、テキスト全体が特定のフレーズを含んでいれば除外する等のロジック
    for (const ignore of IGNORE_PHRASES) {
      if (text.includes(ignore)) {
         // ここでは厳密な判定が必要ですが、単純なincludeだと「まあのんびり」という単語が含まれるだけで除外されます
         // 今回は正規表現側で「ま」を除外しているのでここは通過しませんが、
         // 正規表現で表現しきれない文脈チェックに使えます。
         return false;
      }
    }

    return true;
  },

  formatMatch: (text: string) => {
    const matches = text.match(REGEX);
    return matches ? matches.join(", ") : "unknown match";
  }
};
