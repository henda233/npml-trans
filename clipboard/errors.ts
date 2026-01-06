export class ClipboardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClipboardError";
  }
}

export class UnsupportedPlatformError extends Error {
  constructor(platform: string) {
    super(`Platform "${platform}" is not supported. Please provide a custom ClipboardProvider.`);
    this.name = "UnsupportedPlatformError";
  }
}