// フィード定義のインターフェース
export interface Feed {
  // フィードの識別名
  name: string;
  // フィードの説明
  description: string;
  // 抽出ロジック（trueを返すとマッチとみなす）
  filter: (text: string, record: any, did: string) => boolean;
  // マッチした場合のコンソール出力用フォーマッター（任意）
  formatMatch?: (text: string) => string;
}
