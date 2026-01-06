# NPML 翻译请求文

## NPML代码:
[1] (prefix){
[2]     (目标编程语言：deno+typescript)
[3]     (目标文件名：main.ts)
[4] }
[5] 
[6] (引用){
[7]     !(docs/api/1-6-api.md)
[8]     !(docs/api/1-8-api.md)
[9]     !(main.ts)
[10]     !(docs/feats/1-7-fix-clipboard.md)
[11] }
[12] 
[13] (实现1.7 功能 Fix){
[14]     (参考1.7 功能 Fix 文档)
[15]     (完善剪切板操作)
[16] }

## 项目结构说明:
./
├── bin/
 ├── npml
 └── npml.tmp-15dffe7e2358ffcc
├── clipboard/
 ├── clipboard.ts
 ├── errors.ts
 ├── factory.ts
 ├── mod.ts
 ├── platform_detector.ts
 └── xsel_clipboard.ts
├── docs/
 ├── api/
 │ ├── 1-6-api.md
 │ └── 1-8-api.md
 ├── feats/
 │ ├── 1-1&1.3.md
 │ ├── 1-4.md
 │ ├── 1-5.md
 │ ├── 1-6-fix-1.md
 │ ├── 1-6.md
 │ ├── 1-7-fix-clipboard.md
 │ └── 1-7.md
 ├── about_npml.md
 ├── project.md
 └── TODO.md
├── npml/
 ├── api/
 │ └── 1-6-api.npml
 ├── feat/
 │ ├── 1-7-feat-fix-clipboard.md
 │ └── 1-7-feat-fix-clipboard.npml
 ├── 1-1-test.npml
 ├── 1-1.npml
 ├── 1-4-test.npml
 ├── 1-4.npml
 ├── 1-5.npml
 ├── 1-6-fix-add-clipboard.npml
 ├── 1-6.npml
 ├── 1-7-fix-clipboard.md
 ├── 1-7-fix-clipboard.npml
 ├── 1-7.npml
 ├── readme.md
 └── readme.npml
├── tests/
 ├── dt_g_test.ts
 ├── file_reader_test.ts
 ├── main_test.ts
 ├── npml_request_generator_test.ts
 └── reference_reader_test.ts
├── .gitignore
├── add_lines.ts
├── deno.json
├── deno.lock
├── directory_tree_generator.ts
├── file_reader.ts
├── main.ts
├── npml_request_generator.ts
├── README_EN.md
├── README.md
└── reference_reader.ts

## 引用内容:
// docs/api/1-6-api.md
[1] ## 一、功能概述  
[2] --------------------------------------------------
[3] 接收一份 `.npml` 源码文件路径，按既定顺序完成以下子任务，最终输出一份可直接交付给翻译模型的 Markdown 聚合文档（或剪贴板文本）：
[4] 
[5] 1. 读取主 NPML 源码并追加行号（复用 1-1 + 1-3）。  
[6] 2. 若命令行显式给出 `-t <dir>`，则生成该目录的层级树（复用 1-5）。  
[7] 3. 若未禁用引用（无 `-dr` 标志），则扫描并读取所有 `!(path[#range])` 引用块，同样追加行号（复用 1-4）。  
[8] 4. 将上述三块内容按固定章节顺序拼接成一份 Markdown 文档。  
[9] 5. 支持两种输出策略：  
[10]    a) 文件输出 – 与输入 `.npml` 同目录、同名、后缀改为 `.md`（通过 `FileOutput` 函数实现）。  
[11]    b) 剪贴板输出 – 将最终文档通过跨平台剪贴板接口写入系统剪贴板（已完整实现，非占位符）。
[12] 
[13] --------------------------------------------------
[14] ## 二、对应代码 / 配置 / 资源文件
[15] --------------------------------------------------
[16] | 类型 | 路径（相对于项目根） | 说明 |
[17] |---|---|---|
[18] | 核心代码 | `npml_request_generator.ts` | 本功能唯一实现文件 |
[19] | 依赖接口 | `file_reader.ts` | 1-1 功能，提供 `readFile(path):Promise<string|null>` |
[20] | 依赖接口 | `reference_reader.ts` | 1-4 功能，提供 `readReferences(content):Promise<ReferenceResult[]>` |
[21] | 依赖接口 | `directory_tree_generator.ts` | 1-5 功能，提供 `generateTree(dir):Promise<string|null>` |
[22] | 依赖接口 | `clipboard/mod.ts` | 1-8 功能，提供剪贴板操作接口 |
[23] | 外部库 | `jsr:@std/path` | 用于安全计算输出文件路径 |
[24] | 外部库 | `jsr:@std/fs` | 用于 `ensureFileSync` |
[25] 
[26] --------------------------------------------------
[27] ## 三、公共 API 清单
[28] --------------------------------------------------
[29] ### 1. 接口：GenerationOptions  
[30] **描述**：控制生成行为的轻量级 DTO。  
[31] **源码位置**：`npml_request_generator.ts` 顶部。  
[32] 
[33] ```ts
[34] export interface GenerationOptions {
[35]   /** 若提供，则生成该目录树并写入"项目结构说明"章节 */
[36]   includeDirTree?: string;
[37]   /** true 时跳过引用内容读取（对应 CLI 的 `-dr` 标志） */
[38]   skipReferences?: boolean;
[39]   /** true 时将最终文档复制到剪贴板（对应 CLI 的 `-c` 标志） */
[40]   outputToClipboard?: boolean;
[41] }
[42] ```
[43] 
[44] ### 2. 类：NpmlRequestGenerator  
[45] **描述**：聚合协调器（依赖注入风格）。  
[46] **构造时必须传入四个已实例化的依赖对象**，符合"单一职责 & 关注点分离"原则。  
[47] 
[48] ```ts
[49] export class NpmlRequestGenerator {
[50]   constructor(
[51]     fileReader: FileReader,
[52]     referenceReader: NPMLReferenceReader,
[53]     dirTreeGenerator: DirectoryTreeGenerator,
[54]     clipboard: Clipboard
[55]   ) {}
[56] 
[57]   /** 核心入口函数 */
[58]   async generateRequest(
[59]     npmlFilePath: string,
[60]     options: GenerationOptions
[61]   ): Promise<string | null>;
[62] }
[63] ```
[64] 
[65] **方法签名与行为**：  
[66] - `generateRequest`  
[67]   – 入参：`npmlFilePath` 必须指向可读 `.npml` 文件；`options` 可为空对象（默认全 false）。  
[68]   – 回参：成功返回完整 Markdown 字符串；任一子步骤失败回 `null` 并在控制台打印 `[Error] xxx`。  
[69]   – 副作用：  
[70]     • 若 `outputToClipboard===true`，会将内容写入系统剪贴板。  
[71]     • 内部不会自动写盘；写盘需调用方再执行 `FileOutput()`。  
[72] 
[73] ### 3. 纯函数：FileOutput  
[74] **描述**：将已生成的 Markdown 内容原子写入磁盘，路径规则"同目录 + 同名 + .md"。  
[75] **签名**：
[76] 
[77] ```ts
[78] export function FileOutput(mdContent: string, npmlFilePath: string): string
[79] ```
[80] 
[81] - 返回值为写入后的绝对路径。  
[82] - 若父目录不存在则自动创建；若目标已存在则静默覆盖。  
[83] - 任何 IO 异常直接抛出，由调用方（CLI 主流程）捕获并统一处理。  
[84] 
[85] --------------------------------------------------
[86] ## 四、与其他功能的联动关系
[87] --------------------------------------------------
[88] | 本功能步骤 | 使用的外部功能 | 调用方式 | 数据约定 |
[89] |---|---|---|---|
[90] | ① 读取主文件 | 1-1 文件按行读取 | `fileReader.readFile(npmlFilePath)` | 返回 `string|null`；内部已统一追加行号 |
[91] | ② 读取引用块 | 1-4 NPML引用内容读取 | `referenceReader.readReferences(mainContent)` | 返回 `ReferenceResult[]`；内部已追加行号 |
[92] | ③ 生成目录树 | 1-5 目录结构树生成 | `dirTreeGenerator.generateTree(options.includeDirTree)` | 返回 `string|null`；已格式化为缩进文本 |
[93] | ④ 剪贴板写入 | 1-8 剪贴板操作 | `clipboard.writeText(content)` | 跨平台实现，当前基于 xsel |
[94] | ⑤ 文件写盘 | （新增） | `FileOutput(md, npmlFilePath)` | 纯函数，无其他功能依赖 |
[95] 
[96] --------------------------------------------------
[97] ## 五、错误处理策略
[98] --------------------------------------------------
[99] - 任何依赖返回 `null` 即视为"不可恢复的业务错误"，本类立即短路返回 `null` 并打印 `[Error] xxx`。  
[100] - 剪贴板写入失败视为"可选能力失败"，同样返回 `null`（符合需求文档"任意错误即整体失败"）。  
[101] - 磁盘写入失败由 `FileOutput` 抛出异常，交由上层 CLI 捕获并退出非零状态。  
[102] - 所有错误信息前缀统一为 `[Error]`，便于日志过滤和监控。
[103] 
[104] --------------------------------------------------
[105] ## 六、剪贴板实现细节
[106] --------------------------------------------------
[107] - **抽象接口**：定义了 `Clipboard` 接口，包含 `writeText(content: string): Promise<void>` 方法
[108] - **具体实现**：
[109]   - Linux/Unix 系统：使用 `xsel_clipboard.ts` 基于 xsel 命令行工具实现
[110]   - 通过依赖注入方式注入到 `NpmlRequestGenerator`，实现跨平台支持
[111] - **错误处理**：剪贴板写入失败会捕获异常并返回 `null`，在控制台打印详细错误信息
---
// docs/api/1-8-api.md
[1] # LinguaForgeHelper 1.4「剪切板」功能 API 文档
[2] 
[3] ## 一、功能概述
[4] 为整个 CLI 工具提供“一次写入、随处可贴”的跨平台剪贴板能力。  
[5] 上层功能（1.1 行号显示、1.2 多文件合并）通过统一异步接口与系统剪贴板交互，无需关心底层平台差异。  
[6] 当前默认实现仅支持 Linux，依赖系统命令 `xsel`；其他平台可通过依赖注入扩展。
[7] 
[8] ---
[9] 
[10] ## 二、相关文件清单
[11] 
[12] | 类别 | 路径 | 作用 |
[13] | ---- | ---- | ---- |
[14] | 接口定义 | `clipboard/clipboard.ts` | 声明 `Clipboard` 接口 |
[15] | 错误定义 | `clipboard/errors.ts` | 定义 `ClipboardError`、`UnsupportedPlatformError` |
[16] | 工厂 & 守卫 | `clipboard/factory.ts` | `createDefaultClipboard()`、`guardXsel()` |
[17] | Linux 实现 | `clipboard/xsel_clipboard.ts` | `XselClipboard` 类 |
[18] | 平台探测 | `clipboard/platform_detector.ts` | `PlatformDetector` 工具类 |
[19] | 公共入口 | `clipboard/mod.ts` | 统一重新导出所有对外可见符号 |
[20] | 配置 | `deno.json` | 预声明 `allow-run`、`allow-env` 权限 |
[21] 
[22] ---
[23] 
[24] ## 三、API 参考
[25] 
[26] ### 3.1 核心接口
[27] 
[28] ```ts
[29] // clipboard/clipboard.ts
[30] export interface Clipboard {
[31]   /** 将文本写入系统剪贴板 */
[32]   writeText(text: string): Promise<void>;
[33]   /** 读取系统剪贴板文本 */
[34]   readText(): Promise<string>;
[35] }
[36] ```
[37] 
[38] ### 3.2 错误类型
[39] 
[40] ```ts
[41] // clipboard/errors.ts
[42] export class ClipboardError extends Error {
[43]   name: "ClipboardError";
[44] }
[45] 
[46] export class UnsupportedPlatformError extends Error {
[47]   constructor(platform: string);
[48]   name: "UnsupportedPlatformError";
[49] }
[50] ```
[51] 
[52] ### 3.3 平台探测
[53] 
[54] ```ts
[55] // clipboard/platform_detector.ts
[56] export class PlatformDetector {
[57]   /** 返回当前操作系统枚举 */
[58]   static getOS(): "linux" | "macos" | "windows" | "other";
[59] 
[60]   /** 检查指定二进制是否存在 `$PATH` 中 */
[61]   static async hasBinary(name: string): Promise<boolean>;
[62] }
[63] ```
[64] 
[65] ### 3.4 工厂函数
[66] 
[67] ```ts
[68] // clipboard/factory.ts
[69] /** 启动时调用，确保 xsel 已安装；缺失则打印提示并退出进程 */
[70] export async function guardXsel(): Promise<void>;
[71] 
[72] /** 根据平台创建默认 Clipboard 实例；非 Linux 将抛 `UnsupportedPlatformError` */
[73] export function createDefaultClipboard(): Clipboard;
[74] ```
[75] 
[76] ### 3.5 Linux 默认实现
[77] 
[78] ```ts
[79] // clipboard/xsel_clipboard.ts
[80] export class XselClipboard implements Clipboard {
[81]   async writeText(text: string): Promise<void>;
[82]   async readText(): Promise<string>;
[83] }
[84] ```
[85] 
[86] ---
[87] 
[88] ## 四、与其他功能的联动关系
[89] 
[90] ```
[91] 1.1 行号显示 → Clipboard.writeText
[92] 1.2 多文件合并 → Clipboard.writeText
[93]         ↑
[94]    统一依赖 Clipboard 接口
[95]         ↑
[96] main.ts 在启动时通过 createDefaultClipboard() 注入具体实现（XselClipboard）
[97] ```
[98] 
[99] - 上层功能仅导入 `clipboard/mod.ts`，零平台细节泄露。  
[100] - 未来新增平台或“远程剪贴板”等能力时，只需新增实现类并注册到 DI 容器，无需改动 1.1/1.2 任何代码，符合“开闭原则”。
[101] 
[102] ---
[103] 
[104] ## 五、使用示例
[105] 
[106] ```ts
[107] import { createDefaultClipboard, guardXsel } from "./clipboard/mod.ts";
[108] 
[109] // 1. 启动守卫（Linux 下检查 xsel）
[110] await guardXsel();
[111] 
[112] // 2. 获取实例
[113] const clip = createDefaultClipboard();
[114] 
[115] // 3. 写入/读取
[116] await clip.writeText("hello NPML");
[117] const content = await clip.readText();
[118] console.log(content); // → hello NPML
[119] ```
[120] 
[121] ---
[122] 
[123] ## 六、权限声明
[124] 
[125] 在 `deno.json` 中需预先声明：
[126] 
[127] ```json
[128] {
[129]   "permissions": {
[130]     "allow-run": ["xsel"],
[131]     "allow-env": ["DISPLAY", "WAYLAND_DISPLAY", "XDG_SESSION_TYPE"]
[132]   }
[133] }
[134] ```
[135] 
[136] ---
[137] 
[138] ## 七、扩展指南
[139] 
[140] 1. 自定义实现  
[141]    新建类实现 `Clipboard` 接口，例如 `MyClipboard`。  
[142] 2. 依赖注入  
[143]    在 `~/.lf-helper/config.ts` 中默认导出：  
[144]    ```ts
[145]    export default { clipboard: new MyClipboard() };
[146]    ```  
[147]    启动脚本加载该配置即可完成替换，核心代码无需任何改动。
[148] ```
---
// main.ts
[1] import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
[2] import { NpmlRequestGenerator, FileOutput, GenerationOptions } from "./npml_request_generator.ts";
[3] import { FileReader } from "./file_reader.ts";
[4] import { NPMLReferenceReader } from "./reference_reader.ts";
[5] import { RealDirectoryTreeGenerator } from "./directory_tree_generator.ts";
[6] 
[7] const VERSION = "0.0.2";
[8] 
[9] function printHelp() {
[10]   console.log(`
[11] npml <file.npml>  生成翻译请求文（默认输出同名 .md）
[12] -t <dir>         附加目录树
[13] -c               输出到剪贴板（不生成文件）
[14] -dr              禁用引用读取
[15] -v               版本
[16] -h               帮助
[17]   `.trim());
[18] }
[19] 
[20] function printVersion() {
[21]   console.log(`npml/${VERSION}`);
[22] }
[23] 
[24] async function main() {
[25]   const args = parse(Deno.args, {
[26]     boolean: ["c", "dr", "v", "h"],
[27]     string: ["t"],
[28]     alias: { help: "h", version: "v" },
[29]     stopEarly: true,
[30]   });
[31] 
[32]   if (args.v) { printVersion(); Deno.exit(0); }
[33]   if (args.h || args._.length === 0) { printHelp(); Deno.exit(0); }
[34] 
[35]   const [npmlFile] = args._;
[36]   if (typeof npmlFile !== "string") {
[37]     console.error("[Error] 必须指定一个 .npml 文件");
[38]     Deno.exit(1);
[39]   }
[40]   console.log(`arg.t == ${args.t}`);
[41] 
[42]   // 实例化 1.6 所需依赖
[43]   const fileReader = new FileReader();
[44]   const referenceReader = new NPMLReferenceReader(fileReader);
[45]   const dirTreeGen = new RealDirectoryTreeGenerator();
[46]   const generator = new NpmlRequestGenerator(fileReader, referenceReader, dirTreeGen);
[47] 
[48]   const options: GenerationOptions = {
[49]     includeDirTree: args.t,
[50]     skipReferences: args.dr,
[51]     outputToClipboard: args.c,
[52]   };
[53] 
[54]   const md = await generator.generateRequest(npmlFile, options);
[55]   if (md === null) {
[56]     // 内部已打印 [Error] 详情
[57]     Deno.exit(1);
[58]   }
[59] 
[60]   if (args.c) {
[61]     // 未来替换为 Deno.writeText(await clipboard(), md)
[62]     console.log("--- Content to be copied to clipboard ---");
[63]     console.log(md);
[64]   } else {
[65]     try {
[66]       const outPath = FileOutput(md, npmlFile);
[67]       console.log(`[OK] 已生成 ${outPath}`);
[68]     } catch (e) {
[69]       console.error(`[Error] 写盘失败: ${(e as Error).message}`);
[70]       Deno.exit(1);
[71]     }
[72]   }
[73] }
[74] 
[75] if (import.meta.main) {
[76]   await main();
[77] }
---
// docs/feats/1-7-fix-clipboard.md
[1] # NPML 1.7 功能 Fix 文档：完善剪切板操作
[2] 
[3] ## 功能模块概述
[4] 
[5] 本功能旨在完善并增强 NPML CLI 工具的剪切板操作能力。在现有功能 1.6（NPML 请求生成）和功能 1.8（剪切板操作核心接口）的基础上，修复和完善从 CLI 命令行参数解析到最终剪切板写入的整个流程。确保 `-c` 标志能够正确地将生成的 Markdown 文档内容写入系统剪贴板，而不是仅打印到控制台。
[6] 
[7] ## 开发类型
[8] 
[9] - **主要类型**：功能实现与完善
[10] - **次要类型**：Bug 修复（修复当前仅打印到控制台而未写入剪贴板的问题）
[11] 
[12] ## 标准库、框架、第三方库
[13] 
[14] - **核心逻辑**：`std/flags/mod.ts` (已弃用，但当前仍在使用，未来应迁移至 `std/cli/parse_args.ts`)，用于解析命令行参数。
[15] - **剪贴板核心**：`clipboard/mod.ts`，提供统一的 `Clipboard` 接口及其实现。
[16]   - **Linux 实现**：依赖 `xsel` 命令行工具。
[17] - **项目内部模块**：
[18]   - `npml_request_generator.ts`：核心生成器。
[19]   - `main.ts`：CLI 主入口。
[20] 
[21] **配置与权限**：在 `deno.json` 中需声明 `allow-run` 权限（用于执行 `xsel`）和 `allow-env` 权限（用于访问显示环境变量）。
[22] 
[23] ## 功能的具体实现细节
[24] 
[25] 1.  **命令行参数解析**：CLI 使用 `std/flags` 库解析 `Deno.args`。关键参数 `-c`（或 `--clipboard`）被定义为布尔类型，当存在时，`parse` 函数返回的对象 `args` 中 `args.c` 的值为 `true`。
[26] 2.  **选项传递**：解析出的 `args.c` 值被封装到 `GenerationOptions` 对象的 `outputToClipboard` 属性中，并传递给 `NpmlRequestGenerator`。
[27] 3.  **剪贴板实例注入**：在 `main.ts` 的 `main` 函数中，通过 `createDefaultClipboard()` 工厂函数创建一个 `Clipboard` 接口的实例（例如 `XselClipboard`）。
[28] 4.  **依赖注入**：这个 `Clipboard` 实例作为依赖注入到 `NpmlRequestGenerator` 的构造函数中。
[29] 5.  **内容生成与条件写入**：`NpmlRequestGenerator.generateRequest` 方法负责生成最终的 Markdown 内容。如果 `options.outputToClipboard` 为 `true`，该方法将调用注入的 `clipboard.writeText(mdContent)` 方法。
[30] 6.  **错误处理**：在 `main.ts` 的主流程中，如果 `args.c` 为真，程序不再执行 `console.log` 打印内容到终端，而是直接使用 `clipboard.writeText`。此操作需要被 `try...catch` 包裹，以捕获剪贴板写入失败（如 `xsel` 命令未找到或执行失败）的异常。如果写入失败，应打印错误信息到控制台并退出非零状态码。
[31] 7.  **修复点**：当前代码（`main.ts` 第 60-64 行）在 `args.c` 为真时，仅执行了 `console.log`，这是需要被移除或替换的逻辑。新的实现应在此处调用 `clipboard.writeText`。
[32] 
[33] ## 可能会创建的类、接口和函数
[34] 
[35] - **接口**：`clipboard/clipboard.ts` 中定义的 `Clipboard` 接口（已存在）。
[36] - **类**：`clipboard/xsel_clipboard.ts` 中的 `XselClipboard` 类（已存在）。
[37] - **函数**：
[38]   - `clipboard/factory.ts` 中的 `createDefaultClipboard()`（已存在）。
[39]   - `main.ts` 中的 `main` 函数，其内部逻辑将被修改以实现剪贴板写入。
[40] 
[41] ## 与项目其他功能的关系（依赖关系）
[42] 
[43] - **依赖**：`main.ts` 依赖于 `clipboard/mod.ts` 提供的工厂函数和接口。
[44] - **依赖**：`NpmlRequestGenerator` 依赖于 `clipboard/clipboard.ts` 定义的 `Clipboard` 接口（通过依赖注入接收实例）。
[45] - **被依赖**：`main.ts` 是 CLI 的入口，它组合了 `NpmlRequestGenerator` 和 `Clipboard` 的能力，是最终调用剪贴板功能的模块。
[46] - **关联**：此功能是功能 1.6（NPML 生成）的一个输出选项，与功能 1.8（剪贴板接口）共同构成了完整的剪贴板输出链路。它与功能 1.1（行号显示）、1.2（多文件合并）等上层功能无直接关联，但共享了底层的 `Clipboard` 抽象。
