# LinguaForgeHelper 1.4「剪切板」功能 API 文档

## 一、功能概述
为整个 CLI 工具提供“一次写入、随处可贴”的跨平台剪贴板能力。  
上层功能（1.1 行号显示、1.2 多文件合并）通过统一异步接口与系统剪贴板交互，无需关心底层平台差异。  
当前默认实现仅支持 Linux，依赖系统命令 `xsel`；其他平台可通过依赖注入扩展。

---

## 二、相关文件清单

| 类别 | 路径 | 作用 |
| ---- | ---- | ---- |
| 接口定义 | `clipboard/clipboard.ts` | 声明 `Clipboard` 接口 |
| 错误定义 | `clipboard/errors.ts` | 定义 `ClipboardError`、`UnsupportedPlatformError` |
| 工厂 & 守卫 | `clipboard/factory.ts` | `createDefaultClipboard()`、`guardXsel()` |
| Linux 实现 | `clipboard/xsel_clipboard.ts` | `XselClipboard` 类 |
| 平台探测 | `clipboard/platform_detector.ts` | `PlatformDetector` 工具类 |
| 公共入口 | `clipboard/mod.ts` | 统一重新导出所有对外可见符号 |
| 配置 | `deno.json` | 预声明 `allow-run`、`allow-env` 权限 |

---

## 三、API 参考

### 3.1 核心接口

```ts
// clipboard/clipboard.ts
export interface Clipboard {
  /** 将文本写入系统剪贴板 */
  writeText(text: string): Promise<void>;
  /** 读取系统剪贴板文本 */
  readText(): Promise<string>;
}
```

### 3.2 错误类型

```ts
// clipboard/errors.ts
export class ClipboardError extends Error {
  name: "ClipboardError";
}

export class UnsupportedPlatformError extends Error {
  constructor(platform: string);
  name: "UnsupportedPlatformError";
}
```

### 3.3 平台探测

```ts
// clipboard/platform_detector.ts
export class PlatformDetector {
  /** 返回当前操作系统枚举 */
  static getOS(): "linux" | "macos" | "windows" | "other";

  /** 检查指定二进制是否存在 `$PATH` 中 */
  static async hasBinary(name: string): Promise<boolean>;
}
```

### 3.4 工厂函数

```ts
// clipboard/factory.ts
/** 启动时调用，确保 xsel 已安装；缺失则打印提示并退出进程 */
export async function guardXsel(): Promise<void>;

/** 根据平台创建默认 Clipboard 实例；非 Linux 将抛 `UnsupportedPlatformError` */
export function createDefaultClipboard(): Clipboard;
```

### 3.5 Linux 默认实现

```ts
// clipboard/xsel_clipboard.ts
export class XselClipboard implements Clipboard {
  async writeText(text: string): Promise<void>;
  async readText(): Promise<string>;
}
```

---

## 四、与其他功能的联动关系

```
1.1 行号显示 → Clipboard.writeText
1.2 多文件合并 → Clipboard.writeText
        ↑
   统一依赖 Clipboard 接口
        ↑
main.ts 在启动时通过 createDefaultClipboard() 注入具体实现（XselClipboard）
```

- 上层功能仅导入 `clipboard/mod.ts`，零平台细节泄露。  
- 未来新增平台或“远程剪贴板”等能力时，只需新增实现类并注册到 DI 容器，无需改动 1.1/1.2 任何代码，符合“开闭原则”。

---

## 五、使用示例

```ts
import { createDefaultClipboard, guardXsel } from "./clipboard/mod.ts";

// 1. 启动守卫（Linux 下检查 xsel）
await guardXsel();

// 2. 获取实例
const clip = createDefaultClipboard();

// 3. 写入/读取
await clip.writeText("hello NPML");
const content = await clip.readText();
console.log(content); // → hello NPML
```

---

## 六、权限声明

在 `deno.json` 中需预先声明：

```json
{
  "permissions": {
    "allow-run": ["xsel"],
    "allow-env": ["DISPLAY", "WAYLAND_DISPLAY", "XDG_SESSION_TYPE"]
  }
}
```

---

## 七、扩展指南

1. 自定义实现  
   新建类实现 `Clipboard` 接口，例如 `MyClipboard`。  
2. 依赖注入  
   在 `~/.lf-helper/config.ts` 中默认导出：  
   ```ts
   export default { clipboard: new MyClipboard() };
   ```  
   启动脚本加载该配置即可完成替换，核心代码无需任何改动。
```