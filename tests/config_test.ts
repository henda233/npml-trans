// config_test.ts
import { assertEquals, assertExists } from "@std/assert";
import {
  getConfigPath,
  getDefaultConfig,
  ensureConfigFileExists,
  readConfig,
  writeConfig,
} from "../config/mod.ts";

Deno.test("getConfigPath - 返回当前平台路径", () => {
  const path = getConfigPath();
  assertExists(path);
  // 仅做存在性检查，具体路径随平台变化
});

Deno.test("getDefaultConfig - 返回默认配置对象", () => {
  const cfg = getDefaultConfig();
  assertEquals(typeof cfg.prompt_url, "string");
  assertEquals(cfg.prompt_url.includes("https://"), true);
});

Deno.test("ensureConfigFileExists - 文件不存在时自动创建默认配置", async () => {
  const tmpDir = await Deno.makeTempDir();
  const tmpPath = `${tmpDir}/npml_test_config.json`;

  await ensureConfigFileExists(tmpPath);

  const stat = await Deno.stat(tmpPath);
  assertExists(stat);

  // 清理
  await Deno.remove(tmpPath);
  await Deno.remove(tmpDir);
});

Deno.test("readConfig - 读取并解析配置", async () => {
  const tmpDir = await Deno.makeTempDir();
  const tmpPath = `${tmpDir}/npml_test_config.json`;
  const expectUrl = "https://example.com/prompt.md";

  await Deno.writeTextFile(
    tmpPath,
    JSON.stringify({ prompt_url: expectUrl }, null, 2),
  );

  const cfg = await readConfig(tmpPath);
  assertEquals(cfg.prompt_url, expectUrl);

  // 清理
  await Deno.remove(tmpPath);
  await Deno.remove(tmpDir);
});

Deno.test("writeConfig - 原子写入配置", async () => {
  const tmpDir = await Deno.makeTempDir();
  const tmpPath = `${tmpDir}/npml_test_config.json`;
  const newCfg = { prompt_url: "https://new.example.com/prompt.md" };

  await writeConfig(tmpPath, newCfg);

  const raw = await Deno.readTextFile(tmpPath);
  const cfg = JSON.parse(raw);
  assertEquals(cfg.prompt_url, newCfg.prompt_url);

  // 清理
  await Deno.remove(tmpPath);
  await Deno.remove(tmpDir);
});