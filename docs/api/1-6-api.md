## 一、功能概述  
--------------------------------------------------
接收一份 `.npml` 源码文件路径，按既定顺序完成以下子任务，最终输出一份可直接交付给翻译模型的 Markdown 聚合文档（或剪贴板文本）：

1. 读取主 NPML 源码并追加行号（复用 1-1 + 1-3）。  
2. 若命令行显式给出 `-t <dir>`，则生成该目录的层级树（复用 1-5）。  
3. 若未禁用引用（无 `-dr` 标志），则扫描并读取所有 `!(path[#range])` 引用块，同样追加行号（复用 1-4）。  
4. 将上述三块内容按固定章节顺序拼接成一份 Markdown 文档。  
5. 支持两种输出策略：  
   a) 文件输出 – 与输入 `.npml` 同目录、同名、后缀改为 `.md`（通过 `FileOutput` 函数实现）。  
   b) 剪贴板输出 – 将最终文档通过跨平台剪贴板接口写入系统剪贴板（已完整实现，非占位符）。

--------------------------------------------------
## 二、对应代码 / 配置 / 资源文件
--------------------------------------------------
| 类型 | 路径（相对于项目根） | 说明 |
|---|---|---|
| 核心代码 | `npml_request_generator.ts` | 本功能唯一实现文件 |
| 依赖接口 | `file_reader.ts` | 1-1 功能，提供 `readFile(path):Promise<string|null>` |
| 依赖接口 | `reference_reader.ts` | 1-4 功能，提供 `readReferences(content):Promise<ReferenceResult[]>` |
| 依赖接口 | `directory_tree_generator.ts` | 1-5 功能，提供 `generateTree(dir):Promise<string|null>` |
| 依赖接口 | `clipboard/mod.ts` | 1-8 功能，提供剪贴板操作接口 |
| 依赖接口 | `prompt_cache.ts` | 1-6-1 功能，提供 `PromptCache` 类用于获取翻译提示词 |
| 依赖接口 | `config/mod.ts` | 1-9 功能，提供 `readConfig()` 读取配置文件 |
| 外部库 | `jsr:@std/path` | 用于安全计算输出文件路径 |
| 外部库 | `jsr:@std/fs` | 用于 `ensureFileSync` |

--------------------------------------------------
## 三、公共 API 清单
--------------------------------------------------
### 1. 接口：GenerationOptions  
**描述**：控制生成行为的轻量级 DTO。  
**源码位置**：`npml_request_generator.ts` 顶部。  

```ts
export interface GenerationOptions {
  /** 若提供，则生成该目录树并写入"项目结构说明"章节 */
  includeDirTree?: string;
  /** true 时跳过引用内容读取（对应 CLI 的 `-dr` 标志） */
  skipReferences?: boolean;
  /** true 时将最终文档复制到剪贴板（对应 CLI 的 `-c` 标志） */
  outputToClipboard?: boolean;
}
```

### 2. 类：NpmlRequestGenerator  
**描述**：聚合协调器（依赖注入风格）。  
**构造时必须传入四个已实例化的依赖对象**，符合"单一职责 & 关注点分离"原则。  

```ts
export class NpmlRequestGenerator {
  constructor(
    fileReader: FileReader,
    referenceReader: NPMLReferenceReader,
    dirTreeGenerator: DirectoryTreeGenerator,
    clipboard: Clipboard
  ) {}

  /** 核心入口函数 */
  async generateRequest(
    npmlFilePath: string,
    options: GenerationOptions
  ): Promise<string | null>;
}
```

**方法签名与行为**：  
- `generateRequest`  
  – 入参：`npmlFilePath` 必须指向可读 `.npml` 文件；`options` 可为空对象（默认全 false）。  
  – 回参：成功返回完整 Markdown 字符串；任一子步骤失败回 `null` 并在控制台打印 `[Error] xxx`。  
  – 副作用：  
    • 若 `outputToClipboard===true`，会将内容写入系统剪贴板。  
    • 内部不会自动写盘；写盘需调用方再执行 `FileOutput()`。  

### 3. 纯函数：FileOutput  
**描述**：将已生成的 Markdown 内容原子写入磁盘，路径规则"同目录 + 同名 + .md"。  
**签名**：

```ts
export function FileOutput(mdContent: string, npmlFilePath: string): string
```

- 返回值为写入后的绝对路径。  
- 若父目录不存在则自动创建；若目标已存在则静默覆盖。  
- 任何 IO 异常直接抛出，由调用方（CLI 主流程）捕获并统一处理。  

--------------------------------------------------
## 四、与其他功能的联动关系
--------------------------------------------------
| 本功能步骤 | 使用的外部功能 | 调用方式 | 数据约定 |
|---|---|---|---|
| ① 读取主文件 | 1-1 文件按行读取 | `fileReader.readFile(npmlFilePath)` | 返回 `string|null`；内部已统一追加行号 |
| ② 读取引用块 | 1-4 NPML引用内容读取 | `referenceReader.readReferences(mainContent)` | 返回 `ReferenceResult[]`；内部已追加行号 |
| ③ 生成目录树 | 1-5 目录结构树生成 | `dirTreeGenerator.generateTree(options.includeDirTree)` | 返回 `string|null`；已格式化为缩进文本 |
| ④ 获取翻译提示词 | 1-6-1 翻译提示词获取 | `promptCache.getPromptText(url)` | 返回 `string`；优先本地缓存，失败则网络抓取 |
| ⑤ 剪贴板写入 | 1-8 剪贴板操作 | `clipboard.writeText(content)` | 跨平台实现，当前基于 xsel |
| ⑥ 文件写盘 | （新增） | `FileOutput(md, npmlFilePath)` | 纯函数，无其他功能依赖 |

--------------------------------------------------
## 五、错误处理策略
--------------------------------------------------
- 任何依赖返回 `null` 即视为"不可恢复的业务错误"，本类立即短路返回 `null` 并打印 `[Error] xxx`。  
- 剪贴板写入失败视为"可选能力失败"，同样返回 `null`（符合需求文档"任意错误即整体失败"）。  
- 磁盘写入失败由 `FileOutput` 抛出异常，交由上层 CLI 捕获并退出非零状态。  
- 所有错误信息前缀统一为 `[Error]`，便于日志过滤和监控。

--------------------------------------------------
## 六、剪贴板实现细节
--------------------------------------------------
- **抽象接口**：定义了 `Clipboard` 接口，包含 `writeText(content: string): Promise<void>` 方法
- **具体实现**：
  - Linux/Unix 系统：使用 `xsel_clipboard.ts` 基于 xsel 命令行工具实现
  - 通过依赖注入方式注入到 `NpmlRequestGenerator`，实现跨平台支持
- **错误处理**：剪贴板写入失败会捕获异常并返回 `null`，在控制台打印详细错误信息