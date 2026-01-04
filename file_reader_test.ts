// file_reader_test.ts
import { assertEquals, assert } from "@std/assert";
import { FileReader } from "./file_reader.ts";

Deno.test("FileReader - 读取完整文件", async () => {
  const fileReader = new FileReader();
  // 创建一个临时测试文件
  const testContent = "Line 1\nLine 2\nLine 3";
  const testFile = "temp_test_file.txt";
  await Deno.writeTextFile(testFile, testContent);

  try {
    const result = await fileReader.readFile(testFile);
    const expected = "[1] Line 1\n[2] Line 2\n[3] Line 3";
    assertEquals(result, expected);
  } finally {
    // 清理临时文件
    await Deno.remove(testFile);
  }
});

Deno.test("FileReader - 读取单行", async () => {
  const fileReader = new FileReader();
  const testContent = "Line 1\nLine 2\nLine 3";
  const testFile = "temp_test_file_single.txt";
  await Deno.writeTextFile(testFile, testContent);

  try {
    const result = await fileReader.readFile(`${testFile}#2`);
    const expected = "[2] Line 2";
    assertEquals(result, expected);
  } finally {
    await Deno.remove(testFile);
  }
});

Deno.test("FileReader - 读取多行范围", async () => {
  const fileReader = new FileReader();
  const testContent = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
  const testFile = "temp_test_file_range.txt";
  await Deno.writeTextFile(testFile, testContent);

  try {
    const result = await fileReader.readFile(`${testFile}#2:4`);
    const expected = "[2] Line 2\n[3] Line 3\n[4] Line 4";
    assertEquals(result, expected);
  } finally {
    await Deno.remove(testFile);
  }
});

Deno.test("FileReader - 读取超出文件长度的范围", async () => {
  const fileReader = new FileReader();
  const testContent = "Line 1\nLine 2\nLine 3";
  const testFile = "temp_test_file_out_of_range.txt";
  await Deno.writeTextFile(testFile, testContent);

  try {
    // 请求 2-10 行，但文件只有 3 行，应返回 2-3 行
    const result = await fileReader.readFile(`${testFile}#2:10`);
    const expected = "[2] Line 2\n[3] Line 3";
    assertEquals(result, expected);
  } finally {
    await Deno.remove(testFile);
  }
});

Deno.test("FileReader - 读取不存在的文件", async () => {
  const fileReader = new FileReader();
  const result = await fileReader.readFile("non_existent_file.txt");
  assertEquals(result, null);
});

Deno.test("FileReader - 解析无效格式的 filePathWithRange - 非数字行号", async () => {
  const fileReader = new FileReader();
  const result = await fileReader.readFile("./file.txt#a:b");
  assertEquals(result, null);
});

Deno.test("FileReader - 解析无效格式的 filePathWithRange - 起始行大于结束行", async () => {
  const fileReader = new FileReader();
  const result = await fileReader.readFile("./file.txt#10:5");
  assertEquals(result, null);
});

Deno.test("FileReader - 解析无效格式的 filePathWithRange - 行号为0", async () => {
  const fileReader = new FileReader();
  const result = await fileReader.readFile("./file.txt#0");
  assertEquals(result, null);
});

Deno.test("FileReader - 解析无效格式的 filePathWithRange - 结束行号为0", async () => {
  const fileReader = new FileReader();
  const result = await fileReader.readFile("./file.txt#1:0");
  assertEquals(result, null);
});

Deno.test("FileReader - 解析有效格式的 filePathWithRange", () => {
  const fileReader = new FileReader();

  // 使用反射或直接调用私有方法进行测试，这里我们通过 readFile 的返回值间接测试
  // 因为 parsePathWithRange 是私有的，我们可以通过给定有效输入看其是否能正确处理来验证

  // 例如，一个有效的路径应该不会立即返回 null（如果文件存在）
  // 但为了测试解析本身，我们创建一个 mock 文件读取方法
  // 这里我们主要测试公共 API 的行为，私有方法的逻辑依赖公共 API 的正确性
  // 我们可以构造一个文件，其内容使得特定范围的读取能验证解析逻辑
  const testContent = "Line 1\nLine 2\nLine 3";
  const testFile = "temp_parse_test.txt";
  Deno.writeTextFile(testFile, testContent).then(async () => {
    try {
      // 测试解析并读取第一行
      const result = await fileReader.readFile(`${testFile}#1`);
      assertEquals(result, "[1] Line 1");
    } finally {
      await Deno.remove(testFile);
    }
  });
});

Deno.test("FileReader - 读取空文件", async () => {
  const fileReader = new FileReader();
  const testFile = "temp_empty_file.txt";
  await Deno.writeTextFile(testFile, "");

  try {
    const result = await fileReader.readFile(testFile);
    const expected = "";
    assertEquals(result, expected);
  } finally {
    await Deno.remove(testFile);
  }
});

Deno.test("FileReader - 读取单行文件", async () => {
  const fileReader = new FileReader();
  const testContent = "Single Line Content";
  const testFile = "temp_single_line.txt";
  await Deno.writeTextFile(testFile, testContent);

  try {
    const result = await fileReader.readFile(testFile);
    const expected = "[1] Single Line Content";
    assertEquals(result, expected);
  } finally {
    await Deno.remove(testFile);
  }
});

Deno.test("FileReader - 读取包含CR+LF换行符的文件", async () => {
  const fileReader = new FileReader();
  const testContent = "Line 1\r\nLine 2\r\nLine 3";
  const testFile = "temp_crlf_file.txt";
  await Deno.writeTextFile(testFile, testContent);

  try {
    const result = await fileReader.readFile(testFile);
    const expected = "[1] Line 1\r\n[2] Line 2\r\n[3] Line 3";
    assertEquals(result, expected);
  } finally {
    await Deno.remove(testFile);
  }
});

Deno.test("FileReader - 读取指定范围时起始行超出文件范围", async () => {
  const fileReader = new FileReader();
  const testContent = "Line 1\nLine 2\nLine 3";
  const testFile = "temp_out_of_bounds_start.txt";
  await Deno.writeTextFile(testFile, testContent);

  try {
    // 请求第 10 行开始，超出范围，应返回空字符串 ""
    const result = await fileReader.readFile(`${testFile}#10:15`);
    const expected = "";
    assertEquals(result, expected);
  } finally {
    await Deno.remove(testFile);
  }
});