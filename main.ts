import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { NpmlRequestGenerator, FileOutput, GenerationOptions } from "./npml_request_generator.ts";
import { FileReader } from "./file_reader.ts";
import { NPMLReferenceReader } from "./reference_reader.ts";
import { RealDirectoryTreeGenerator } from "./directory_tree_generator.ts";

const VERSION = "0.0.1";

function printHelp() {
  console.log(`
npml <file.npml>  生成翻译请求文（默认输出同名 .md）
-t <dir>         附加目录树
-c               输出到剪贴板（不生成文件）
-dr              禁用引用读取
-v               版本
-h               帮助
  `.trim());
}

function printVersion() {
  console.log(`npml/${VERSION}`);
}

async function main() {
  const args = parse(Deno.args, {
    boolean: ["c", "dr", "v", "h"],
    string: ["t"],
    alias: { help: "h", version: "v" },
    stopEarly: true,
  });

  if (args.v) { printVersion(); Deno.exit(0); }
  if (args.h || args._.length === 0) { printHelp(); Deno.exit(0); }

  const [npmlFile] = args._;
  if (typeof npmlFile !== "string") {
    console.error("[Error] 必须指定一个 .npml 文件");
    Deno.exit(1);
  }
  console.log(`arg.t == ${args.t}`);

  // 实例化 1.6 所需依赖
  const fileReader = new FileReader();
  const referenceReader = new NPMLReferenceReader(fileReader);
  const dirTreeGen = new RealDirectoryTreeGenerator();
  const generator = new NpmlRequestGenerator(fileReader, referenceReader, dirTreeGen);

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
    // 未来替换为 Deno.writeText(await clipboard(), md)
    console.log("--- Content to be copied to clipboard ---");
    console.log(md);
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