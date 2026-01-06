// npml_request_generator.ts
import { FileReader } from "./file_reader.ts";
import { NPMLReferenceReader, ReferenceResult } from "./reference_reader.ts";
import { DirectoryTreeGenerator } from "./directory_tree_generator.ts";
import { Clipboard } from "./clipboard/mod.ts";

export interface GenerationOptions {
  includeDirTree?: string;
  skipReferences?: boolean;
  outputToClipboard?: boolean;
}

export class NpmlRequestGenerator {
  private fileReader: FileReader;
  private referenceReader: NPMLReferenceReader;
  private dirTreeGenerator: DirectoryTreeGenerator;
  private clipboard: Clipboard;

  constructor(
    fileReader: FileReader,
    referenceReader: NPMLReferenceReader,
    dirTreeGenerator: DirectoryTreeGenerator,
    clipboard: Clipboard
  ) {
    this.fileReader = fileReader;
    this.referenceReader = referenceReader;
    this.dirTreeGenerator = dirTreeGenerator;
    this.clipboard = clipboard;
  }

  async generateRequest(
    npmlFilePath: string,
    options: GenerationOptions
  ): Promise<string | null> {
    const mainNpmlContent = await this.fileReader.readFile(npmlFilePath);
    if (mainNpmlContent === null) {
      console.error(`[Error] Failed to read main NPML file: ${npmlFilePath}`);
      return null;
    }

    let dirTreeContent = "";
    if (options.includeDirTree) {
      const tree = await this.dirTreeGenerator.generateTree(options.includeDirTree);
      if (tree === null) {
        console.error(`[Error] Failed to generate directory tree for path: ${options.includeDirTree}`);
        return null;
      }
      dirTreeContent = `## 项目结构说明:\n${tree}\n`;
    }

    let referencesContent = "";
    if (!options.skipReferences) {
      const references = await this.referenceReader.readReferences(mainNpmlContent);
      if (references === null) {
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

    const finalContent = `# NPML 翻译请求文\n\n## NPML代码:\n${mainNpmlContent}\n\n${dirTreeContent}${referencesContent}`;

    if (options.outputToClipboard) {
      try {
        await this.clipboard.writeText(finalContent);
      } catch (e) {
        console.error(`[Error] Failed to write to clipboard: ${(e as Error).message}`);
        return null;
      }
    }

    return finalContent;
  }
}

import * as path from "jsr:@std/path";
import * as fs from "jsr:@std/fs";

export function FileOutput(mdContent: string, npmlFilePath: string): string {
  const dir = path.dirname(npmlFilePath);
  const base = path.basename(npmlFilePath, path.extname(npmlFilePath));
  const outFile = path.join(dir, base + ".md");

  fs.ensureFileSync(outFile);
  Deno.writeTextFileSync(outFile, mdContent, { create: true});
  return outFile;
}