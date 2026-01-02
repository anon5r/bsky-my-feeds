import WebSocket from "ws";

export class CompatibleWebSocket extends WebSocket {
  // @ts-ignore - Override binaryType to handle 'blob' which is not supported by ws
  get binaryType(): string {
    return super.binaryType;
  }

  // @ts-ignore
  set binaryType(value: string) {
    if (value === "blob") {
      // ws package (Node.js) doesn't support blob. 
      // We'll fallback to default or ignore.
      // Default in ws is 'nodebuffer'. 'arraybuffer' is also supported.
      // partysocket wants blob, but we can't give it.
      // We will quietly ignore 'blob' or set it to 'nodebuffer'/'arraybuffer' if needed.
      // Let's just ignore the 'blob' assignment to prevent the crash.
      return; 
    }
    super.binaryType = value as any;
  }
}
