// npml_request_generator.ts
import { FileReader } from "./file_reader.ts";
import { NPMLReferenceReader, ReferenceResult } from "./reference_reader.ts";
import { DirectoryTreeGenerator } from "./directory_tree_generator.ts";

/**
 * 生成选项接口
 */
export interface GenerationOptions {
  /**
   * 一个可选的目录路径。如果提供，将生成该目录的结构树并包含在最终文档中。
   */
  includeDirTree?: string;
  /**
   * 一个布尔值。如果为 `true`，则跳过读取和聚合引用内容。
   */
  skipReferences?: boolean;
  /**
   * 一个布尔值。如果为 `true`，则在生成文档后将其内容复制到剪贴板。
   */
  outputToClipboard?: boolean;
}

/**
 * 核心类: NpmlRequestGenerator
 * 负责协调 NPML 文件读取、引用内容提取、目录结构生成以及最终文档的聚合和格式化。
 */
export class NpmlRequestGenerator {
  private fileReader: FileReader;
  private referenceReader: NPMLReferenceReader;
  private dirTreeGenerator: DirectoryTreeGenerator;

  constructor(
    fileReader: FileReader,
    referenceReader: NPMLReferenceReader,
    dirTreeGenerator: DirectoryTreeGenerator
  ) {
    this.fileReader = fileReader;
    this.referenceReader = referenceReader;
    this.dirTreeGenerator = dirTreeGenerator;
  }

  /**
   * 功能: 接收一个 NPML 文件路径和一个包含可选配置的 `options` 对象，
   * 执行完整的聚合流程，并返回最终的 Markdown 文档内容。
   *
   * @param npmlFilePath 指向待处理的 `.npml` 文件的路径。
   * @param options 包含可选配置的 GenerationOptions 对象。
   * @returns 一个 `Promise`，其结果为 `string | null`。
   *          成功时返回完整的 Markdown 字符串，失败时返回 `null`。
   */
  async generateRequest(
    npmlFilePath: string,
    options: GenerationOptions
  ): Promise<string | null> {
    // 1. 读取主 NPML 文件内容并添加行号
    const mainNpmlContent = await this.fileReader.readFile(npmlFilePath);
    if (mainNpmlContent === null) {
      console.error(`[Error] Failed to read main NPML file: ${npmlFilePath}`);
      return null;
    }

    // 2. 生成目录结构 (如果需要)
    let dirTreeContent = "";
    if (options.includeDirTree) {
      const tree = await this.dirTreeGenerator.generateTree(options.includeDirTree);
      if (tree === null) {
        console.error(`[Error] Failed to generate directory tree for path: ${options.includeDirTree}`);
        return null;
      }
      dirTreeContent = `## 项目结构说明:\n${tree}\n`;
    }

    // 3. 读取引用内容 (如果需要)
    let referencesContent = "";
    if (!options.skipReferences) {
      const references = await this.referenceReader.readReferences(mainNpmlContent);
      if (references === null) {
         // readReferences 不应返回 null，但为健壮性考虑
         console.error(`[Error] Failed to read references from NPML file: ${npmlFilePath}`);
         return null;
      }
      const validReferences = references.filter(r => r.content !== null);
      if (validReferences.length > 0) {
        referencesContent = "## 引用内容:\n";
        for (let i = 0; i < validReferences.length; i++) {
          const ref = validReferences[i];
          referencesContent += `// ${ref.path}\n${ref.content}`;
          if (i < validReferences.length - 1) {
            referencesContent += "\n---\n";
          }
        }
        referencesContent += "\n";
      }
    }

    // 4. 聚合内容
    const finalContent = `# NPML 翻译请求文\n\n## NPML代码:\n${mainNpmlContent}\n\n${dirTreeContent}${referencesContent}`;

    // 5. 输出处理 (如果需要复制到剪贴板)
    if (options.outputToClipboard) {
      try {
        // Note: Deno's clipboard API might require a specific flag or library in the future.
        // For now, this is a placeholder using `navigator.clipboard` which requires a web context.
        // A potential solution is to use a Deno library like `https://deno.land/x/clipboard@v0.0.1/mod.ts`
        // or shell commands via `Deno.run`, but that introduces platform dependencies.
        // For this implementation, we'll log a message indicating the intent.
        console.log("--- Content to be copied to clipboard ---");
        console.log(finalContent);
        console.log("----------------------------------------");
        console.warn("Clipboard API not directly available in Deno CLI context. Content printed above.");
        // Example of how it might look with a future API or library:
        // await Deno.writeClipboard(finalContent);
      } catch (e) {
        console.error(`[Error] Failed to write to clipboard: ${(e as Error).message}`);
        // We still return the content even if clipboard fails, as the core generation succeeded.
        // However, the spec says return null if "any" error occurs. We'll return null for clipboard failure.
        return null;
      }
    }

    return finalContent;
  }
}

// 新增：引入 Deno 标准库用于文件写盘
import * as path from "jsr:@std/path";
import * as fs from "jsr:@std/fs";

/**
 * 新增：文件输出纯函数
 * 把 Markdown 内容写入与输入 .npml 文件同目录、同名的 .md 文件，覆盖无提示。
 * @param mdContent 已聚合好的最终 Markdown 字符串
 * @param npmlFilePath 原始 .npml 文件路径（用于计算输出路径）
 * @returns 写入后的绝对路径；失败则抛出异常
 */
export function fileOutput(mdContent: string, npmlFilePath: string): string {
  const dir = path.dirname(npmlFilePath);
  const base = path.basename(npmlFilePath, path.extname(npmlFilePath));
  const outFile = path.join(dir, base + ".md");

  // 确保父目录存在（同步版，避免额外 async 传染）
  fs.ensureFileSync(outFile);
  // 原子覆盖写盘
  Deno.writeTextFileSync(outFile, mdContent, { create: true});
  return outFile;
}