// reference_reader.ts

import { FileReader } from "./file_reader.ts";

export interface ReferenceResult {
  path: string;
  content: string | null;
}

export class NPMLReferenceReader {
  private fileReader: FileReader;

  constructor(fileReader: FileReader) {
    this.fileReader = fileReader;
  }

  /**
   * 解析并读取NPML内容中的所有引用标记。
   * 引用标记格式: !(path/to/file.txt), !(path/to/file.txt#2), !(path/to/file.txt#2:5)
   *
   * @param npmlContent - 包含NPML代码及其引用标记的原始字符串。
   * @returns Promise<ReferenceResult[]> - 一个Promise，其结果是一个数组。
   *          数组中每个元素是一个对象，包含 path（原始引用路径）和 content（读取到的带行号的文件内容字符串）。
   *          如果某个引用读取失败（如文件不存在），则对应数组元素的 content 为 null。
   *          如果NPML内容中没有任何引用标记，则返回一个空数组 []。
   */
  async readReferences(npmlContent: string): Promise<ReferenceResult[]> {
    // 使用正则表达式全局匹配所有 !(...) 格式的引用标记
    const regex = /!\(([^)]+)\)/g;
    const results: ReferenceResult[] = [];
    let match;

    // 循环查找所有匹配项
    while ((match = regex.exec(npmlContent)) !== null) {
      // match[1] 是括号内的内容，例如 "docs/libs/start.md#5"
      const referencePath = match[1];
      // 调用注入的 FileReader 来读取内容
      const content = await this.fileReader.readFile(referencePath);
      results.push({
        path: referencePath, // 保存原始引用路径
        content: content,    // 保存读取到的内容（可能为null）
      });
    }

    return results;
  }
}