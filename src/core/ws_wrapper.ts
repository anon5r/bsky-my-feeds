import WebSocket from "ws";

export class CompatibleWebSocket extends WebSocket {
  // @ts-ignore
  get binaryType(): string {
    // @ts-ignore
    return this._binaryType || "nodebuffer";
  }

  // @ts-ignore
  set binaryType(value: string) {
    if (value === "blob") {
      // ws package (Node.js) doesn't support blob. 
      // We'll fallback to default or ignore.
      return; 
    }
    // @ts-ignore
    super.binaryType = value;
  }
}