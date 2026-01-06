## 功能1.9：配置文件管理（API文档）

### 1. 功能概述  
功能1.9为 NPML 翻译器提供“一次配置、多次复用”的提示词 URL 管理能力。  
- 启动时自动发现或创建配置文件，避免手动干预。  
- 对外暴露统一接口，供“提示词抓取模块”读取 `prompt_url`。  
- 支持平台无关的默认路径，保证 Windows / macOS / Linux 零差异体验。  

### 2. 代码与资源清单  
| 类型 | 路径 | 说明 |
|---|---|---|
| 主模块 | `config/mod.ts` | 全部 API 实现 |
| 默认提示词 | 远程 URL（GitHub Raw） | 硬编码于 `DEFAULT_PROMPT_URL` |
| 本地文件 | `~/.config/npml/config.json` 等 | 自动创建，用户可手动修改 |

### 3. 公共 API 签名  
```ts
// 接口定义
export interface Config {
  prompt_url: string;
}

// 路径相关
export function getConfigPath(): string;
export function getDefaultConfig(): Config;

// 生命周期
export async function ensureConfigFileExists(path: string): Promise<void>;
export async function readConfig(path?: string): Promise<Config>;
export async function writeConfig(path: string, config: Config): Promise<void>;
```

### 4. 函数/接口详细说明  

| 名称 | 签名 | 功能 | 异常 |
|---|---|---|---|
| `getConfigPath` | `() => string` | 按 OS 返回标准配置文件绝对路径 | 不支持平台抛 `Error` |
| `getDefaultConfig` | `() => Config` | 返回内置默认对象（含官方 prompt_url） | — |
| `ensureConfigFileExists` | `(path: string) => Promise<void>` | 文件不存在时自动写入默认配置 | 仅包装 IO 异常 |
| `readConfig` | `(path?: string) => Promise<Config>` | 读→解析→返回；文件缺失时先创建 | JSON 语法错误会冒泡 |
| `writeConfig` | `(path, config) => Promise<void>` | 原子写：确保目录存在后落盘 | 同 Deno.writeTextFile 异常 |

### 5. 与其他功能的联动  
- **被依赖**  
  - `npml_request_generator.ts`（功能 1.6.1）在抓取提示词前调用 `readConfig().prompt_url`。  
- **依赖**  
  - Deno 运行时：`Deno.readTextFile` / `Deno.writeTextFile` / `Deno.env`。  
  - 标准库：`jsr:@std/fs/ensureDir`、`jsr:@std/path/join`。  

### 6. 配置示例  
首次运行后生成的 `~/.config/npml/config.json`（macOS 示例）：  
```json
{
  "prompt_url": "https://raw.githubusercontent.com/henda233/lingua-forge/main/prompts/npml.md "
}
```
用户可手动修改 URL 以指向私有提示词仓库。