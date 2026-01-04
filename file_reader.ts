// file_reader.ts
export class FileReader {
  private parsePathWithRange(filePathWithRange: string): { filePath: string; startLine: number | null; endLine: number | null } | null {
    // 支持格式: path/to/file.txt, path/to/file.txt#2, path/to/file.txt#2:5
    const parts = filePathWithRange.split("#");
    if (parts.length > 2) {
      // 不允许出现多个 '#'
      return null;
    }

    const filePath = parts[0];
    if (parts.length === 1) {
      // 没有 '#'，返回完整路径，行号为 null
      return { filePath, startLine: null, endLine: null };
    }

    const rangeStr = parts[1];
    const rangeParts = rangeStr.split(":");
    let startLine: number | null = null;
    let endLine: number | null = null;

    if (rangeParts.length === 1) {
      // 只有一个数字，例如 #2
      const num = parseInt(rangeParts[0], 10);
      if (isNaN(num) || num <= 0) {
        return null; // 非数字或小于等于0
      }
      startLine = num;
      endLine = null; // 单行模式，endLine 设为 null
    } else if (rangeParts.length === 2) {
      // 两个数字，例如 #2:5
      const num1 = parseInt(rangeParts[0], 10);
      const num2 = parseInt(rangeParts[1], 10);
      if (isNaN(num1) || isNaN(num2) || num1 <= 0 || num2 <= 0 || num1 > num2) {
        return null; // 非数字或小于等于0 或 起始大于结束
      }
      startLine = num1;
      endLine = num2;
    } else {
      // 包含多个 ':' 或其他无效格式
      return null;
    }

    return { filePath, startLine, endLine };
  }

  async readFile(filePathWithRange: string): Promise<string | null> {
    const parsed = this.parsePathWithRange(filePathWithRange);
    if (!parsed) {
      return null; // 格式无效
    }
    const { filePath, startLine, endLine } = parsed;
    let content: string;
    try {
      content = await Deno.readTextFile(filePath);
    } catch (error) {
      // 捕获文件不存在或其他读取错误
      if (error instanceof Deno.errors.NotFound) {
        console.error(`File not found: ${filePath}`);
      } else {
        // 检查error是否有message属性
        const errorMessage = (error instanceof Error) ? error.message : (typeof error === 'string') ? error : 'Unknown error occurred';
        console.error(`Error reading file ${filePath}: ${errorMessage}`);
      }
      return null;
    }
    if (content === "") {
      return "";
    }
    const lines = content.split(/\r?\n/); // 以兼容不同换行符分割
    const totalLines = lines.length;
    // 确定要处理的行索引范围 (0-based)
    let startIndex: number;
    let endIndex: number;

    if (startLine !== null) {
      // 调整为 0-based 索引
      startIndex = startLine - 1;
      if (startIndex < 0 || startIndex >= totalLines) {
        return ""; // 起始行超出范围，返回空字符串
      }
      if (endLine !== null) {
        // 调整为 0-based 索引
        endIndex = endLine - 1;
        if (endIndex < startIndex) {
          return null; // 结束行小于起始行，无效范围
        }
        // 修正：如果指定了 endLine，就使用它计算 endIndex
        // endIndex 已经在上面设置
      } else {
        // 修正：如果未指定结束行，endIndex 应该等于 startIndex，即只读一行
        endIndex = startIndex;
      }
    } else {
      // 未指定行号范围，读取整个文件
      startIndex = 0;
      endIndex = totalLines - 1;
    }

    // 确保索引不超出实际行数 (虽然上面的逻辑已处理，但保留以防万一)
    startIndex = Math.max(0, startIndex);
    endIndex = Math.min(totalLines - 1, endIndex);

    // 提取指定范围的行
    const selectedLines = lines.slice(startIndex, endIndex + 1); // slice(endIndex + 1) 是因为不包含 endIndex

    // 添加行号前缀 (1-based)
    const numberedLines = selectedLines.map((line, index) => {
      const lineNumber = startIndex + index + 1; // 计算原始文件中的行号
      return `[${lineNumber}] ${line}`;
    });

    return numberedLines.join('\n');
  }
}