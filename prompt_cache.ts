// prompt_cache.ts
import * as path from "jsr:@std/path";
import * as fs from "jsr:@std/fs";

const DEFAULT_PROMPT_URL = "https://raw.githubusercontent.com/henda233/lingua-forge/main/prompts/npml.md";
const CACHE_FILE_NAME = "npml_prompt.md";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function getCacheDir(): string {
  switch (Deno.build.os) {
    case "linux":
      return path.join(Deno.env.get("HOME")!, ".local", "share", "npml");
    case "windows":
      return path.join(Deno.env.get("USERPROFILE")!, "Documents", "npml");
    case "darwin":
      return path.join(Deno.env.get("HOME")!, "Library", "Application Support", "npml");
    default:
      throw new Error("Unsupported platform");
  }
}

function getCachePath(): string {
  return path.join(getCacheDir(), CACHE_FILE_NAME);
}

function isCacheValid(cachePath: string): boolean {
  try {
    const stat = Deno.statSync(cachePath);
    return Date.now() - stat.mtime!.getTime() < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

export class PromptCache {
  private fetchPromise: Promise<string> | null = null;

  async getPromptText(url?: string): Promise<string> {
    const targetUrl = url || DEFAULT_PROMPT_URL;
    const cachePath = getCachePath();

    if (!this.fetchPromise) {
      this.fetchPromise = this.loadPrompt(targetUrl, cachePath);
    }
    return this.fetchPromise;
  }

  async syncPrompt(url?: string): Promise<void> {
    const targetUrl = url || DEFAULT_PROMPT_URL;
    const cachePath = getCachePath();

    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error(`Network error: ${res.status} ${res.statusText}`);
    const text = await res.text();

    await fs.ensureDir(path.dirname(cachePath));
    await Deno.writeTextFile(cachePath, text);
  }

  private async loadPrompt(url: string, cachePath: string): Promise<string> {
    if (isCacheValid(cachePath)) {
      return await Deno.readTextFile(cachePath);
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Network error: ${res.status} ${res.statusText}`);
      const text = await res.text();

      await fs.ensureDir(path.dirname(cachePath));
      await Deno.writeTextFile(cachePath, text);

      return text;
    } catch (err) {
      if (await fs.exists(cachePath)) {
        console.warn("[Warn] Network failed, fallback to stale cache");
        return await Deno.readTextFile(cachePath);
      }
      throw err;
    }
  }
}