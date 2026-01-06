import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { NpmlRequestGenerator, FileOutput, GenerationOptions } from "./npml_request_generator.ts";
import { FileReader } from "./file_reader.ts";
import { NPMLReferenceReader } from "./reference_reader.ts";
import { RealDirectoryTreeGenerator } from "./directory_tree_generator.ts";
import { createDefaultClipboard, guardXsel } from "./clipboard/mod.ts";
const VERSION = "0.0.3";

function printHelp() {
  console.log(`
npml <file.npml>  生成翻译请求文（默认输出同名 .md）
-t <dir>         附加目录树
-c               输出到剪贴板（不生成文件）
-dr              禁用引用读取
-p               主动线上同步NPML提示词
-v               版本
-h               帮助
  `.trim());
}

function printVersion() {
  console.log(`npml/${VERSION}`);
}

async function main() {
  const args = parse(Deno.args, {
    boolean: ["c", "dr", "v", "h", "p"],
    string: ["t"],
    alias: { help: "h", version: "v" },
    stopEarly: true,
  });

    if (args.v) { printVersion(); Deno.exit(0); }
    if (args.h || (args._.length === 0 && !args.p)) { // 修改了此行的条件
      printHelp();
      Deno.exit(0);
    }
    if (args.p) {
      const { PromptCache } = await import("./prompt_cache.ts");
      const cache = new PromptCache();
      try {
        await cache.syncPrompt();
        console.log("[OK] NPML提示词已同步");
      } catch (error) {
        console.error(`[Error] 同步NPML提示词失败: ${(error as Error).message}`);
        Deno.exit(1);
      }
      Deno.exit(0);
    }

  const [npmlFile] = args._;
  if (typeof npmlFile !== "string") {
    console.error("[Error] 必须指定一个 .npml 文件");
    Deno.exit(1);
  }

  // 实例化 1.6 所需依赖
  const fileReader = new FileReader();
  const referenceReader = new NPMLReferenceReader(fileReader);
  const dirTreeGen = new RealDirectoryTreeGenerator();
  await guardXsel(); // 检查剪贴板依赖
  const clipboard = createDefaultClipboard();
  const generator = new NpmlRequestGenerator(fileReader, referenceReader, dirTreeGen, clipboard);
  
  const options: GenerationOptions = {
    includeDirTree: args.t,
    skipReferences: args.dr,
    outputToClipboard: args.c,
  };

  const md = await generator.generateRequest(npmlFile, options);
  if (md === null) {
    // 内部已打印 [Error] 详情
    Deno.exit(1);
  }

  if (args.c) {
    try {
      await clipboard.writeText(md);
      console.log("[OK] 内容已复制到剪贴板");
    } catch (error) {
      console.error(`[Error] 剪贴板写入失败: ${(error as Error).message}`);
      Deno.exit(1);
    }
  } else {
    try {
      const outPath = FileOutput(md, npmlFile);
      console.log(`[OK] 已生成 ${outPath}`);
    } catch (e) {
      console.error(`[Error] 写盘失败: ${(e as Error).message}`);
      Deno.exit(1);
    }
  }
}

if (import.meta.main) {
  await main();
}