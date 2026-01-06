# NPML 1.7 功能 Fix 文档：完善剪切板操作

## 功能模块概述

本功能旨在完善并增强 NPML CLI 工具的剪切板操作能力。在现有功能 1.6（NPML 请求生成）和功能 1.8（剪切板操作核心接口）的基础上，修复和完善从 CLI 命令行参数解析到最终剪切板写入的整个流程。确保 `-c` 标志能够正确地将生成的 Markdown 文档内容写入系统剪贴板，而不是仅打印到控制台。

## 开发类型

- **主要类型**：功能实现与完善
- **次要类型**：Bug 修复（修复当前仅打印到控制台而未写入剪贴板的问题）

## 标准库、框架、第三方库

- **核心逻辑**：`std/flags/mod.ts` (已弃用，但当前仍在使用，未来应迁移至 `std/cli/parse_args.ts`)，用于解析命令行参数。
- **剪贴板核心**：`clipboard/mod.ts`，提供统一的 `Clipboard` 接口及其实现。
  - **Linux 实现**：依赖 `xsel` 命令行工具。
- **项目内部模块**：
  - `npml_request_generator.ts`：核心生成器。
  - `main.ts`：CLI 主入口。

**配置与权限**：在 `deno.json` 中需声明 `allow-run` 权限（用于执行 `xsel`）和 `allow-env` 权限（用于访问显示环境变量）。

## 功能的具体实现细节

1.  **命令行参数解析**：CLI 使用 `std/flags` 库解析 `Deno.args`。关键参数 `-c`（或 `--clipboard`）被定义为布尔类型，当存在时，`parse` 函数返回的对象 `args` 中 `args.c` 的值为 `true`。
2.  **选项传递**：解析出的 `args.c` 值被封装到 `GenerationOptions` 对象的 `outputToClipboard` 属性中，并传递给 `NpmlRequestGenerator`。
3.  **剪贴板实例注入**：在 `main.ts` 的 `main` 函数中，通过 `createDefaultClipboard()` 工厂函数创建一个 `Clipboard` 接口的实例（例如 `XselClipboard`）。
4.  **依赖注入**：这个 `Clipboard` 实例作为依赖注入到 `NpmlRequestGenerator` 的构造函数中。
5.  **内容生成与条件写入**：`NpmlRequestGenerator.generateRequest` 方法负责生成最终的 Markdown 内容。如果 `options.outputToClipboard` 为 `true`，该方法将调用注入的 `clipboard.writeText(mdContent)` 方法。
6.  **错误处理**：在 `main.ts` 的主流程中，如果 `args.c` 为真，程序不再执行 `console.log` 打印内容到终端，而是直接使用 `clipboard.writeText`。此操作需要被 `try...catch` 包裹，以捕获剪贴板写入失败（如 `xsel` 命令未找到或执行失败）的异常。如果写入失败，应打印错误信息到控制台并退出非零状态码。
7.  **修复点**：当前代码（`main.ts` 第 60-64 行）在 `args.c` 为真时，仅执行了 `console.log`，这是需要被移除或替换的逻辑。新的实现应在此处调用 `clipboard.writeText`。

## 可能会创建的类、接口和函数

- **接口**：`clipboard/clipboard.ts` 中定义的 `Clipboard` 接口（已存在）。
- **类**：`clipboard/xsel_clipboard.ts` 中的 `XselClipboard` 类（已存在）。
- **函数**：
  - `clipboard/factory.ts` 中的 `createDefaultClipboard()`（已存在）。
  - `main.ts` 中的 `main` 函数，其内部逻辑将被修改以实现剪贴板写入。

## 与项目其他功能的关系（依赖关系）

- **依赖**：`main.ts` 依赖于 `clipboard/mod.ts` 提供的工厂函数和接口。
- **依赖**：`NpmlRequestGenerator` 依赖于 `clipboard/clipboard.ts` 定义的 `Clipboard` 接口（通过依赖注入接收实例）。
- **被依赖**：`main.ts` 是 CLI 的入口，它组合了 `NpmlRequestGenerator` 和 `Clipboard` 的能力，是最终调用剪贴板功能的模块。
- **关联**：此功能是功能 1.6（NPML 生成）的一个输出选项，与功能 1.8（剪贴板接口）共同构成了完整的剪贴板输出链路。它与功能 1.1（行号显示）、1.2（多文件合并）等上层功能无直接关联，但共享了底层的 `Clipboard` 抽象。