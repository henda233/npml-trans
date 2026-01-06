export type { Clipboard } from "./clipboard.ts";
export { XselClipboard } from "./xsel_clipboard.ts";
export { PlatformDetector } from "./platform_detector.ts";
export { ClipboardError, UnsupportedPlatformError } from "./errors.ts";
export { createDefaultClipboard, guardXsel } from "./factory.ts";