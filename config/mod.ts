import { ensureDir } from "jsr:@std/fs";
import { join } from "jsr:@std/path";

export interface Config {
  prompt_url: string;
}

const DEFAULT_PROMPT_URL =
  "https://raw.githubusercontent.com/henda233/lingua-forge/main/prompts/npml.md";

function getHomeDir(): string {
  const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
  if (!home) throw new Error("无法确定用户主目录");
  return home;
}

export function getConfigPath(): string {
  const platform = Deno.build.os;
  switch (platform) {
    case "linux":
      return join(getHomeDir(), ".local", "share", "npml", "config.json");
    case "windows":
      return join(getHomeDir(), "Documents", "npml", "config.json");
    case "darwin":
      return join(getHomeDir(), ".config", "npml", "config.json");
    default:
      throw new Error(`不支持的平台: ${platform}`);
  }
}

export function getDefaultConfig(): Config {
  return { prompt_url: DEFAULT_PROMPT_URL };
}

export async function writeConfig(path: string, config: Config): Promise<void> {
  await ensureDir(join(path, ".."));
  await Deno.writeTextFile(path, JSON.stringify(config, null, 2));
}

export async function ensureConfigFileExists(path: string): Promise<void> {
  try {
    await Deno.readTextFile(path);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      await writeConfig(path, getDefaultConfig());
    } else {
      throw err;
    }
  }
}

export async function readConfig(path?: string): Promise<Config> {
  const configPath = path ?? getConfigPath();
  await ensureConfigFileExists(configPath);
  const text = await Deno.readTextFile(configPath);
  return JSON.parse(text) as Config;
}