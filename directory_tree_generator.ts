/**
 * 实现功能 1.5：指定目录结构树生成
 * 根据提供的目录路径，递归遍历并生成一个树状格式的结构字符串。
 * 注意：遍历时会过滤掉名称以 '.' 开头的目录项（隐藏目录），但保留以 '.' 开头的文件。
 */
import * as path from "jsr:@std/path";

export interface DirectoryTreeGenerator {
  generateTree(dirPath: string): Promise<string | null>;
}

export class RealDirectoryTreeGenerator implements DirectoryTreeGenerator {
  async generateTree(dirPath: string): Promise<string | null> {
    let stats: Deno.FileInfo;
    try {
      stats = await Deno.stat(dirPath);
    } catch (error) {
      // 路径不存在或其他访问错误
      if (error instanceof Deno.errors.NotFound || error instanceof Deno.errors.PermissionDenied) {
        return null;
      }
      // 其他未知错误，可以考虑重新抛出或记录日志
      throw error;
    }

    if (!stats.isDirectory) {
      // 路径存在但不是目录
      return null;
    }

    // 使用内部辅助函数进行递归遍历
    const traverse = async (currentPath: string, prefix: string = "", isLast: boolean = true): Promise<string> => {
      const entries = [];
      try {
        // 读取当前目录下的所有条目
        for await (const entry of Deno.readDir(currentPath)) {
          // 过滤隐藏目录：如果 entry 是目录且名称以 '.' 开头，则跳过
          if (entry.isDirectory && entry.name.startsWith('.')) {
            continue; // 跳过这个隐藏目录及其子内容
          }
          entries.push(entry);
        }
      } catch (error) {
        // 如果在遍历子目录时权限不足，这里会捕获到
        if (error instanceof Deno.errors.PermissionDenied) {
          // 可以选择跳过或返回错误信息，这里选择跳过并返回空字符串
          // 或者可以返回类似 "(Permission Denied)" 的标记
          console.error(`Permission denied while reading directory: ${currentPath}`);
          return "";
        }
        throw error; // 其他错误重新抛出
      }

      // 排序：目录在前，文件在后，名称字母顺序
      entries.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name);
        }
        return a.isDirectory ? -1 : 1;
      });

      let output = "";
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const isLastInCurrentDir = i === entries.length - 1;
        const connector = isLastInCurrentDir ? "└── " : "├── ";
        const name = entry.isDirectory ? `${entry.name}/` : entry.name;
        output += `${prefix}${connector}${name}\n`;

        if (entry.isDirectory) {
          const newPrefix = prefix + (isLast ? " " : "│ ");
          const subTree = await traverse(path.join(currentPath, entry.name), newPrefix, isLastInCurrentDir);
          output += subTree;
        }
      }
      return output;
    };

    // 从根目录开始遍历
    const rootName = path.basename(dirPath) + "/";
    const treeContent = await traverse(dirPath, "", true);
    // 根目录名称不带连接符，直接拼接其内容
    return `${rootName}\n${treeContent}`;
  }
}