[中文](README.md) | English
# NPML Translator

## Project Background and Purpose

The NPML Translator is a Deno and TypeScript-based command-line interface (CLI) tool. Its core objective is to address the limitations of natural language programming, specifically in describing complex logic, gauging the level of detail required, and ensuring consistent, deterministic output.

This project introduces NPML (NP-Middle-Language), an intermediate language that blends natural language with high-level programming syntax. NPML aims to combine the flexibility of natural language with the rigor of high-level programming languages, guiding AI coders to generate unambiguous, deterministic code. The translator itself is responsible for converting NPML code into a structured "NPML Translation Request Document," which can then be fed to an AI model to produce the final target code.

## Installation

This project runs on the Deno runtime. Please ensure Deno is installed on your system.

Dependencies are managed via the `deno.json` file:

```json
{
  "tasks": {
    "dev": "deno run --watch main.ts",
    "build-main":"deno compile -A -o bin/npml main.ts"
  },
  "imports": {
    "@std/assert": "jsr:@std/assert@1",
    "@std/fs": "jsr:@std/fs@^1.0.21",
    "@std/path": "jsr:@std/path@^1.1.4"
  }
}
```

To build the executable, you can run the Deno task:

```bash
deno task build-main
```

This will generate an executable file named `bin/npml`.

## NPML CLI Command Usage

The `npml` CLI tool operates via command-line arguments.

- `npml [npml_file_name]`: Reads the specified `.npml` file and generates a Markdown translation request document (`npml_request.md`) containing the file content, references, directory tree, etc.
- `npml -v`: Displays the current version of the `npml` translator.
- `npml -h`: Shows the usage instructions for CLI arguments.
- `npml -c`: Copies the generated translation request document to the clipboard (currently implemented by printing to the console, reserving future clipboard functionality).
- `npml -t [dir_path]`: Specifies a directory path to include its structure in the generated translation request document.
- `npml -dr`: Skips reading the reference content (`!(...)`) from the NPML code when generating the request document.

### Example

```bash
# Generate the translation request document for main.npml
npml main.npml

# Generate the translation request document for main.npml, including the structure of the docs/ directory
npml main.npml -t docs/

# Generate the translation request document for main.npml, but do not read reference content
npml main.npml -dr
```


## About the NPML Concept

NPML (NP-Middle-Language) is an intermediate language situated between natural language and high-level programming languages.

- **Purpose**: To guide AI coders in generating unambiguous, deterministic high-level programming code.
- **Characteristics**: Blends natural language with high-level programming syntax, simpler than high-level languages, yet more flexible than pseudocode.
- **Translator**: Refers to the AI coder capable of converting NPML code into the target programming language. The tool implemented in this project is responsible for generating the "NPML Translation Request Document" as input for the AI.

### NPML Basic Structure

A typical NPML code block includes a definition header, context declaration, implementation statements, high-level intent descriptions, and nested code blocks.

```npml
[Return Type](Name)[Parameter List]{
    (Context Declaration)

    Implementation Statement;

    (High-Level Intent Description)

    var = (Intent Description);

    (Description){
        ...
    }
}
```

- **Definition Header**: `[ReturnType](Name)[ParamType param]` defines the type (function, class, etc.) and name of the code block.
- **Implementation Statement**: Ends with `;`, can be specific code or simplified descriptions.
- **Intent Description**: Natural language wrapped in `()`, describes the functional intent, to be implemented by the AI.
- **Fused Statement**: e.g., `net = (Define a convolutional neural network);`, combines intent with variable definition.