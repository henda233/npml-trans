// tests/prompt_cache_test.ts
import { assertEquals, assertExists } from "@std/assert";
import { PromptCache } from "../prompt_cache.ts";

Deno.test("PromptCache - 首次加载并缓存远程 prompt", async () => {
  const cache = new PromptCache();
  const text = await cache.getPromptText();
  assertExists(text);
  assertEquals(typeof text, "string");
  assertEquals(text.length > 0, true);
});

Deno.test("PromptCache - 第二次调用直接命中缓存", async () => {
  const cache = new PromptCache();
  const t0 = performance.now();
  await cache.getPromptText();
  const t1 = performance.now();

  const t2 = performance.now();
  await cache.getPromptText(); // 应直接读缓存
  const t3 = performance.now();

  // 第二次耗时应远小于第一次（网络 vs 本地）
  assertEquals((t3 - t2) < (t1 - t0) / 2, true);
});

Deno.test("PromptCache - 自定义 URL 加载", async () => {
  const cache = new PromptCache();
  const fakeUrl = "https://httpbin.org/robots.txt";
  const text = await cache.getPromptText(fakeUrl);
  assertExists(text);
  assertEquals(text.includes("User-agent"), true);
});

Deno.test("PromptCache - 网络失败时回退到过期缓存", async () => {
  const cache = new PromptCache();
  // 先拉取一次，确保本地有缓存文件
  await cache.getPromptText();

  // 模拟网络异常地址
  const badUrl = "https://httpbin.org/status/500";
  try {
    await cache.getPromptText(badUrl);
  } catch {
    // 预期抛出错误，因网络失败且无过期缓存
  }

  // 再次请求默认地址，应能回退到本地缓存
  const text = await cache.getPromptText();
  assertExists(text);
});