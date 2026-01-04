/**
 * 文件读取器模块
 * 实现功能 1.1: 读取文件
 * 根据给定的文件路径（相对或绝对）读取文件内容，并可选地支持读取文件的特定行号范围（如 #L 或 #L1:L2）
 * 返回带有行号前缀的文件内容字符串
 */

interface ParsedPathWithRange {
  filePath: string;
  startLine: number | null;
  endLine: number | null;
}

export class FileReader {
  /**
   * 读取文件内容
   * @param filePathWithRange - 包含文件路径和可选行号范围的字符串
   * @returns Promise<string | null> - 成功时返回带行号的字符串，失败时返回 null
   */
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
        const errorMessage = 
          (error instanceof Error) ? error.message : 
          (typeof error === 'string') ? error : 
          'Unknown error occurred';
        console.error(`Error reading file ${filePath}: ${errorMessage}`);
      }
      return null;
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
      } else {
        // 未指定结束行，读取到文件末尾
        endIndex = totalLines - 1;
      }
    } else {
      // 未指定行号范围，读取整个文件
      startIndex = 0;
      endIndex = totalLines - 1;
    }

    // 确保索引不超出实际行数
    startIndex = Math.max(0, startIndex);
    endIndex = Math.min(totalLines - 1, endIndex);

    // 提取指定范围的行
    const selectedLines = lines.slice(startIndex, endIndex + 1);

    // 添加行号前缀 (1-based)
    const numberedLines = selectedLines.map((line, index) => {
      const lineNumber = startIndex + index + 1; // 计算原始文件中的行号
      return `[${lineNumber}] ${line}`;
    });

    return numberedLines.join('\n');
  }

  /**
   * 解析包含路径和范围的字符串
   * @param input - 输入字符串，如 './file.txt#10:20'
   * @returns ParsedPathWithRange | null - 解析成功返回对象，失败返回 null
   */
  private parsePathWithRange(input: string): ParsedPathWithRange | null {
    // 正则表达式解析路径和可选的行号范围
    // ^(.+?)(?:#(\d+)(?::(\d+))?)?$
    // (.+?): 捕获文件路径部分（非贪婪）
    // (?:#(\d+)(?::(\d+))?)?: 可选的行号部分
    //   #: 必须的范围起始符
    //   (\d+): 捕获起始行号
    //   (?::(\d+))?: 可选的 : 后跟结束行号
    const regex = /^(.+?)(?:#(\d+)(?::(\d+))?)?$/;
    const match = input.match(regex);

    if (!match) {
      return null; // 格式不匹配
    }

    const filePath = match[1];
    let startLine: number | null = null;
    let endLine: number | null = null;

    if (match[2]) { // startLine 存在
      startLine = parseInt(match[2], 10);
      if (isNaN(startLine) || startLine < 1) {
        return null; // 行号非数字或小于1
      }
    }

    if (match[3]) { // endLine 存在
      endLine = parseInt(match[3], 10);
      if (isNaN(endLine) || endLine < 1) {
        return null; // 行号非数字或小于1
      }
    }

    // 验证范围逻辑：如果都存在，startLine 应该小于等于 endLine
    if (startLine !== null && endLine !== null && startLine > endLine) {
        return null; // 起始行大于结束行
    }

    return { filePath, startLine, endLine };
  }
}