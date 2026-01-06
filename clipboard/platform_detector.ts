export class PlatformDetector {
  static getOS(): "linux" | "macos" | "windows" | "other" {
    switch (Deno.build.os) {
      case "linux":
        return "linux";
      case "darwin":
        return "macos";
      case "windows":
        return "windows";
      default:
        return "other";
    }
  }

  static async hasBinary(name: string): Promise<boolean> {
    try {
      const cmd = new Deno.Command("which", { args: [name] });
      const { code } = await cmd.output();
      return code === 0;
    } catch {
      return false;
    }
  }
}