// reference_reader_test.ts

import { assertEquals } from "@std/assert";
import { NPMLReferenceReader, ReferenceResult } from "./reference_reader.ts";
import { FileReader } from "./file_reader.ts";

// Mock FileReader class for testing by extending the actual class
class MockFileReader extends FileReader {
  private mockContents: Map<string, string | null>;

  constructor(mockContents: Map<string, string | null>) {
    super(); // Call the parent constructor if necessary
    this.mockContents = mockContents;
  }

//   // Override the readFile method with mock behavior
  override async readFile(filePathWithRange: string): Promise<string | null> {
    // Simulate async operation and return mock content or null
    return Promise.resolve(this.mockContents.get(filePathWithRange) ?? null);
  }
}

Deno.test("NPMLReferenceReader - 无引用内容", async () => {
  const mockFileReader = new MockFileReader(new Map());
  const referenceReader = new NPMLReferenceReader(mockFileReader);

  const npmlContent = "This is a simple NPML content without any references.";
  const results = await referenceReader.readReferences(npmlContent);

  assertEquals(results, []);
});

Deno.test("NPMLReferenceReader - 单个引用", async () => {
  const expectedContent = "[1] Hello World\n[2] This is a test file.";
  const mockContents = new Map([
    ["test.txt", expectedContent],
  ]);
  const mockFileReader = new MockFileReader(mockContents);
  const referenceReader = new NPMLReferenceReader(mockFileReader);

  const npmlContent = `Some text
!(test.txt)
More text.`;
  const results = await referenceReader.readReferences(npmlContent);

  assertEquals(results, [{ path: "test.txt", content: expectedContent }]);
});

Deno.test("NPMLReferenceReader - 多个引用", async () => {
  const content1 = "[1] Content of file one.";
  const content2 = "[1] Line 1\n[2] Line 2 of file two.";
  const content3 = "[3] Specific line from file three.";
  const mockContents = new Map([
    ["file1.txt", content1],
    ["path/to/file2.txt", content2],
    ["file3.txt#3", content3],
  ]);
  const mockFileReader = new MockFileReader(mockContents);
  const referenceReader = new NPMLReferenceReader(mockFileReader);

  const npmlContent = `!(file1.txt)
Middle content !(path/to/file2.txt) more text
!(file3.txt#3) end.`;
  const results = await referenceReader.readReferences(npmlContent);

  assertEquals(results, [
    { path: "file1.txt", content: content1 },
    { path: "path/to/file2.txt", content: content2 },
    { path: "file3.txt#3", content: content3 },
  ]);
});

Deno.test("NPMLReferenceReader - 引用带行号范围", async () => {
  const expectedContent = "[2] Line 2\n[3] Line 3\n[4] Line 4";
  const mockContents = new Map([
    ["range_test.txt#2:4", expectedContent],
  ]);
  const mockFileReader = new MockFileReader(mockContents);
  const referenceReader = new NPMLReferenceReader(mockFileReader);

  const npmlContent = `Start
!(range_test.txt#2:4)
End.`;
  const results = await referenceReader.readReferences(npmlContent);

  assertEquals(results, [{ path: "range_test.txt#2:4", content: expectedContent }]);
});

Deno.test("NPMLReferenceReader - 引用带单行号", async () => {
  const expectedContent = "[5] Just this line.";
  const mockContents = new Map([
    ["single_line.txt#5", expectedContent],
  ]);
  const mockFileReader = new MockFileReader(mockContents);
  const referenceReader = new NPMLReferenceReader(mockFileReader);

  const npmlContent = `!(single_line.txt#5)`;
  const results = await referenceReader.readReferences(npmlContent);

  assertEquals(results, [{ path: "single_line.txt#5", content: expectedContent }]);
});

Deno.test("NPMLReferenceReader - 混合引用", async () => {
  const fullContent = "[1] Full file content.";
  const singleLineContent = "[3] Line 3 only.";
  const rangeContent = "[10] Line 10\n[11] Line 11\n[12] Line 12";
  const mockContents = new Map([
    ["full.txt", fullContent],
    ["single.txt#3", singleLineContent],
    ["range.txt#10:12", rangeContent],
  ]);
  const mockFileReader = new MockFileReader(mockContents);
  const referenceReader = new NPMLReferenceReader(mockFileReader);

  const npmlContent = `!(full.txt)
!(single.txt#3)
!(range.txt#10:12)`;
  const results = await referenceReader.readReferences(npmlContent);

  assertEquals(results, [
    { path: "full.txt", content: fullContent },
    { path: "single.txt#3", content: singleLineContent },
    { path: "range.txt#10:12", content: rangeContent },
  ]);
});

Deno.test("NPMLReferenceReader - 无效引用路径", async () => {
  const mockContents = new Map([
    ["non_existent.txt", null], // Simulate file not found
  ]);
  const mockFileReader = new MockFileReader(mockContents);
  const referenceReader = new NPMLReferenceReader(mockFileReader);

  const npmlContent = `Valid content !(non_existent.txt) more text.`;
  const results = await referenceReader.readReferences(npmlContent);

  assertEquals(results, [{ path: "non_existent.txt", content: null }]);
});

Deno.test("NPMLReferenceReader - 无效引用格式", async () => {
  // The ReferenceReader just passes the path to FileReader.
  // It's the FileReader's job to return null for invalid formats.
  const mockContents = new Map([
    ["file.txt##2", null], // Invalid format handled by FileReader
    ["file.txt#abc:def", null], // Invalid format handled by FileReader
  ]);
  const mockFileReader = new MockFileReader(mockContents);
  const referenceReader = new NPMLReferenceReader(mockFileReader);

  const npmlContent = `!(file.txt##2) and !(file.txt#abc:def) are invalid.`;
  const results = await referenceReader.readReferences(npmlContent);

  assertEquals(results, [
    { path: "file.txt##2", content: null },
    { path: "file.txt#abc:def", content: null },
  ]);
});

Deno.test("NPMLReferenceReader - 引用内容为空", async () => {
  const mockContents = new Map([
    ["empty.txt", ""], // Simulate empty file content
  ]);
  const mockFileReader = new MockFileReader(mockContents);
  const referenceReader = new NPMLReferenceReader(mockFileReader);

  const npmlContent = `!(empty.txt)`;
  const results = await referenceReader.readReferences(npmlContent);

  assertEquals(results, [{ path: "empty.txt", content: "" }]);
});

Deno.test("NPMLReferenceReader - 复杂字符串中的引用", async () => {
  const expectedContent = "[1] Code snippet.";
  const mockContents = new Map([
    ["snippet.ts", expectedContent],
  ]);
  const mockFileReader = new MockFileReader(mockContents);
  const referenceReader = new NPMLReferenceReader(mockFileReader);

  // A more complex string that might appear in NPML
  const npmlContent = `# My NPML Doc

Here is some code:

!(snippet.ts)

And some more text with !() an empty one and !(another.txt) another ref.`;
  const results = await referenceReader.readReferences(npmlContent);

  assertEquals(results, [
    { path: "snippet.ts", content: expectedContent },
    { path: "another.txt", content: null }, // Assuming 'another.txt' doesn't exist in mock
  ]);
});