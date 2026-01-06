import { Clipboard } from "./clipboard.ts";
import { XselClipboard } from "./xsel_clipboard.ts";
import { PlatformDetector } from "./platform_detector.ts";
import { UnsupportedPlatformError } from "./errors.ts";

export async function guardXsel(): Promise<void> {
  const has = await PlatformDetector.hasBinary("xsel");
  if (!has) {
    console.error(
      "%c[ERROR]%c xsel not found. Install it with:\n  sudo apt install xsel    # Debian/Ubuntu\n  sudo apk add xsel        # Alpine\n  sudo dnf install xsel    # Fedora",
      "color:red",
      "color:reset"
    );
    Deno.exit(1);
  }
}

export function createDefaultClipboard(): Clipboard {
  const os = PlatformDetector.getOS();
  if (os === "linux") return new XselClipboard();
  throw new UnsupportedPlatformError(os);
}