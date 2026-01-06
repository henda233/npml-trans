好的，这是根据您提供的NPML代码、引用内容以及参考文档生成的关于功能1.9（配置文件）的开发文档。

# 功能1.9：配置文件

## 功能模块概述

本功能旨在为NPML翻译器项目提供一个统一的配置文件管理机制。主要职责是存储NPML翻译提示词的线上获取地址（URL）。当项目需要获取最新的翻译提示词时，会首先读取此配置文件以确定从何处获取。此外，该功能还负责在配置文件缺失时，自动创建一个包含默认URL的配置文件，确保程序能够顺利运行。

## 开发类型

- **主要类型**：功能实现
- **次要类型**：初始化逻辑（自动创建默认配置）

## 可能涉及到的代码文件

- `config/mod.ts` (或类似路径): 负责配置文件的读取、写入和路径管理的主要模块。
- `main.ts` (或CLI入口文件): 在启动时或需要获取提示词URL时调用配置管理模块。
- `npml_request_generator.ts` (或提示词获取模块): 从配置模块获取 `prompt_url` 并用于后续的线上抓取逻辑。

## 可能用到的标准库、框架、第三方库

- **Deno标准库**:
  - `path`: 用于处理和解析不同操作系统的文件路径。
  - `fs`: 用于读取和写入文件系统（`Deno.readTextFile`, `Deno.writeTextFile`）。
  - `json`: 用于解析和序列化JSON格式的配置文件内容。
- **环境变量库** (如果`path`库不足以处理`~`或`$HOME`): `std/node/os.ts` 或原生Deno API (`Deno.env`) 用于获取用户主目录路径 (`HOME` on Unix, `USERPROFILE` on Windows)。

**配置与权限**: 在 `deno.json` 中需声明 `allow-read` 权限（用于读取配置文件）和 `allow-write` 权限（用于创建或修改配置文件）。

## 功能的具体实现细节

1.  **路径确定**: 程序根据当前运行的操作系统（通过Deno API判断）确定配置文件的存储路径。
    - **Linux**: `~/.local/share/npml/config.json`
    - **Windows**: `C:\Users$$当前用户名]\Documents\npml\config.json`
    - **macOS**: `~/.config/npml/config.json`
2.  **文件读取**: 尝试读取上述确定路径下的 `config.json` 文件。
3.  **文件存在性检查与创建**:
    - 如果文件不存在（捕获 `NotFound` 错误），则创建一个包含默认 `prompt_url` 的JSON对象，并将其写入该路径。
    - 默认的 `prompt_url` 为: `https://raw.githubusercontent.com/henda233/lingua-forge/main/prompts/npml.md`。
    - 如果文件存在，则继续下一步。
4.  **内容解析**: 将读取到的文件内容解析为JSON对象。
5.  **数据提取**: 从解析后的JSON对象中提取 `prompt_url` 字段的值。
6.  **返回URL**: 将提取到的URL返回给调用方（通常是负责获取提示词的模块）。

## 可能会创建的类、接口和函数

- **函数**:
  - `getConfigPath(): string`: 根据操作系统返回配置文件的完整路径。
  - `ensureConfigFileExists(path: string): void`: 检查配置文件是否存在，若不存在则创建包含默认值的文件。
  - `readConfig(): { prompt_url: string }`: 读取并解析配置文件，返回配置对象。
  - `getDefaultConfig(): { prompt_url: string }`: 返回默认配置对象。
  - `writeConfig(path: string, config: { prompt_url: string }): void`: 将配置对象写入指定路径的文件。
- **类** (可选，用于更复杂的配置管理):
  - `ConfigManager`: 封装上述所有配置操作的类。

## 与项目其他功能的关系（依赖关系）

- **被依赖**: `npml_request_generator.ts` 或负责获取提示词的模块会依赖此功能来获取 `prompt_url`。
- **依赖**: 此功能依赖于Deno的文件系统API (`Deno.readTextFile`, `Deno.writeTextFile`) 和路径处理库 (`path`) 来完成文件的读写和路径操作。
- **关联**: 此功能是功能 1.6.1 (NPML翻译提示词的获取) 的前置条件，为其提供必要的URL配置。