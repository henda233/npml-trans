中文 | [English](README_EN.md)

# NPML 翻译器

## 项目背景与目的

NPML 翻译器是一个基于 Deno 和 TypeScript 的命令行工具 (CLI)。其核心目标是解决自然语言编程在复杂逻辑描述、细腻程度把握以及结果不确定性方面的局限性。

该项目实现了 NPML (NP-Middle-Language)，一种混合了自然语言和高级编程语言语法的中间语言。NPML 旨在结合自然语言的灵活性和高级编程语言的严谨性，引导编程 AI 生成无歧义、确定的高级编程语言代码。翻译器本身负责将 NPML 代码转换为结构化的“NPML 翻译请求文”，该请求文可交付给 AI 模型以生成最终的目标代码。

## 安装方式

本项目基于 Deno 运行时。请确保您的系统已安装 Deno。

项目依赖通过 `deno.json` 文件管理：

```json
{
  "tasks": {
    "dev": "deno run --watch main.ts",
    "build-main":"deno compile -A -o bin/npml main.ts"
  },
  "imports": {
    "@std/assert": "jsr:@std/assert@1",
    "@std/fs": "jsr:@std/fs@^1.0.21",
    "@std/path": "jsr:@std/path@^1.0.21"
  }
}
```

要构建可执行文件，可以运行 Deno 任务：

```bash
deno task build-main
```

这将生成一个名为 `bin/npml` 的可执行文件。

## NPML CLI 命令使用教程

`npml` CLI 工具通过命令行参数进行操作。

- `npml [npml_file_name]`: 读取指定的 `.npml` 文件，生成包含文件内容、引用、目录树等信息的 Markdown 翻译请求文 (`npml_request.md`)。
- `npml -v`: 显示当前 `npml` 翻译器的版本。
- `npml -h`: 显示 CLI 参数的使用说明。
- `npml -c`: 将生成的翻译请求文复制到剪贴板（当前实现为打印到控制台，预留未来剪贴板功能）。
- `npml -t [dir_path]`: 指定一个目录路径，将其目录树结构包含在生成的翻译请求文中。
- `npml -dr`: 在生成翻译请求文时，跳过读取 NPML 代码中的引用内容 (`!(...)`)。

### 示例

```bash
# 生成 main.npml 的翻译请求文
npml main.npml

# 生成 main.npml 的翻译请求文，并包含 docs/ 目录的结构
npml -t docs/ main.npml

# 生成 main.npml 的翻译请求文，但不读取引用内容
npml -dr main.npml
```

## 关于 NPML 的概念

NPML (NP-Middle-Language) 是一种介于自然语言和高级编程语言之间的中间语言。

- **目的**: 引导编程 AI 生成无歧义、确定的高级编程语言代码。
- **特点**: 混合自然语言和高级编程语言语法，比高级编程语言更简单，比伪代码更灵活。
- **翻译器**: 指能将 NPML 代码转化为目标编程语言的编程 AI。本项目实现的工具负责生成“NPML 翻译请求文”，作为 AI 的输入。

### NPML 基本结构

一个典型的 NPML 代码块包含定义头、上下文声明、实现语句、高层意图描述和嵌套代码块。

```npml
[返回类型](名称)[参数列表]{
    (上下文声明)

    实现语句;

    (高层意图描述)

    var = (意图描述);

    (描述){
        ...
    }
}
```

- **定义头**: `[ReturnType](Name)[ParamType param]` 定义了代码块的类型（函数、类等）和名称。
- **实现语句**: 以 `;` 结尾，可以是具体代码或简化描述。
- **意图描述**: 用 `()` 包裹的自然语言，描述功能意图，由 AI 实现。
- **融合语句**: 如 `net = (定义一个卷积神经网络);`，将意图与变量定义结合。

## 贡献说明

欢迎贡献代码、优化 NPML 翻译器和 NPML 语言本身的设计。您可以通过提交 Issues 或 Pull Requests 的方式参与项目。