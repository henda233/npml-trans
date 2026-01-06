# 功能 1.6.1 NPML 翻译提示词的获取 —— 开发文档（fix 版）

## 一、功能模块概述  
功能 1.6.1 是“NPML 翻译请求文生成”子模块，负责在本地缓存或远程仓库中取得最新的 NPML 翻译提示词（prompt），供主流程拼接成最终翻译请求文。  
核心目标：  
1. 零配置即可工作（自带默认 URL）。  
2. 一次下载，离线复用（本地缓存）。  
3. 支持用户自定义提示词仓库（通过配置文件）。  

## 二、开发类型  
实现（新增逻辑） + 少量修改（与 1.9 配置模块对接）。

## 三、可能涉及到的代码文件  
| 路径 | 作用 |
|---|---|
| `npml_request_generator.ts` | 主入口，新增 `getPromptText(): Promise<string>` 私有方法 |
| `config/mod.ts` | 复用 1.9 已暴露的 `readConfig(): Config` |
| `clipboard/mod.ts` | 无需改动，仅用于最终输出 |
| 本次新增 `prompt_cache.ts` | 缓存读写、平台路径、缓存过期策略 |

## 四、可能用到的标准库 / 框架 / 第三方库  
| 库 | 用途 | 安装 / 导入示例 |
|---|---|---|
| `jsr:@std/path` | 拼跨平台缓存路径 | `import * as path from "jsr:@std/path";` |
| `jsr:@std/fs` | `ensureDir` 确保缓存目录存在 | `import { ensureDir } from "jsr:@std/fs";` |
| `jsr:@std/cache`（可选） | 若需 TTL 缓存 | 评估中，目前自实现 24h 过期 |
| Deno 内置 | `Deno.readTextFile`、`Deno.writeTextFile`、`Deno.stat` | 无需额外安装 |

## 五、功能具体实现细节（文字描述）  
1. 默认常量  
   - `DEFAULT_PROMPT_URL = "https://raw.githubusercontent.com/henda233/lingua-forge/main/prompts/npml.md"`  
   - `CACHE_FILE_NAME = "npml_prompt.md"`  

2. 平台相关缓存目录（与 1.9 配置目录同级）  
   - Linux: `~/.local/share/npml/npml_prompt.md`  
   - Windows: `C:\Users\<user>\Documents\npml\npml_prompt.md`  
   - macOS: `~/Library/Application Support/npml/npml_prompt.md`  

3. 算法流程  
   ① 调用 `config.mod.ts` 的 `readConfig()` 取得用户级 `prompt_url`（若用户未配置则等于默认 URL）。  
   ② 计算缓存绝对路径，检查：  
      - 文件存在且 `mtime` 在 24h 内 → 直接读缓存返回。  
   ③ 缓存失效或无文件 → `fetch(url)` 下载提示词文本。  
   ④ 下载成功后：  
      - 确保目录存在（`ensureDir`）。  
      - 原子写入缓存文件（`writeTextFile`）。  
   ⑤ 网络失败（离线、404 等）→ 若本地缓存仍存在则降级使用并控制台警告；否则抛 `Error` 终止主流程。  

4. 并发安全  
   - 整个 `getPromptText()` 内部使用单例 Promise 锁，防止同一进程多次同时下载。  

5. 缓存过期策略  
   - 简单时间戳对比：文件修改时间 + 24h。  
   - 未来可扩展为 ETag / If-None-Match。  

6. 异常分类  
   - `NetworkError`：fetch 非 200。  
   - `FileSystemError`：无写权限、磁盘满。  
   - `ConfigError`：config.json 语法错误（由 1.9 模块抛）。  

## 六、可能会创建的类、接口和函数  
| 名称 | 类型 | 职责 |
|---|---|---|
| `PromptCache` | class | 封装“路径计算 / 过期检测 / 读写” |
| `getPromptText(url?: string): Promise<string>` | function | 对外唯一入口，url 缺省时读配置 |
| `getCachePath(): string` | helper | 跨平台缓存路径 |
| `isCacheValid(path: string): boolean` | helper | 24h 有效性检查 |

## 七、与项目其他功能的关系（依赖关系）  
```
npml_request_generator.ts
 ├─ 1.9 config.mod.ts —— 读取 prompt_url
 ├─ prompt_cache.ts（本次新增）
 └─ 最终把提示词字符串拼接到翻译请求文尾部
```
配置模块无需感知缓存逻辑；缓存模块仅依赖 Deno 标准库，零循环依赖。  