import { Clipboard } from "./clipboard.ts";
import { ClipboardError } from "./errors.ts";

export class XselClipboard implements Clipboard {
  private async spawn(args: string[], input?: Uint8Array): Promise<Uint8Array> {
    const cmd = new Deno.Command("xsel", {
      args,
      stdin: input ? "piped" : "null",
      stdout: "piped",
      stderr: "piped",
    });
    const child = cmd.spawn();
    if (input) {
      const writer = child.stdin.getWriter();
      await writer.write(input);
      await writer.close();
    }
    const { code, stdout, stderr } = await child.output();
    if (code !== 0) {
      const msg = new TextDecoder().decode(stderr);
      throw new ClipboardError(`xsel ${args.join(" ")} failed: ${msg}`);
    }
    return stdout;
  }

  async writeText(text: string): Promise<void> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    await this.spawn(["--clipboard", "--input"], data);
  }

  async readText(): Promise<string> {
    const out = await this.spawn(["--clipboard", "--output"]);
    return new TextDecoder().decode(out).replace(/\n$/, "");
  }
}