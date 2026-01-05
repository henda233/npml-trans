import {GenerationOptions, NpmlRequestGenerator, FileOutput} from "./npml_request_generator.ts";
import { FileReader } from "./file_reader.ts";
import { DirectoryTreeGenerator, RealDirectoryTreeGenerator } from "./directory_tree_generator.ts";
import {NPMLReferenceReader} from "./reference_reader.ts";

const npml_request_generator = new NpmlRequestGenerator(
    new FileReader(),
    new NPMLReferenceReader(
        new FileReader()
    ),
    new RealDirectoryTreeGenerator()
);

const options: GenerationOptions = {
    includeDirTree: "./",
    skipReferences: false
};
const npml_path = "./npml/1-4.npml";
const result = await npml_request_generator.generateRequest(npml_path,options);
const output_path = FileOutput(result || "",npml_path);

console.log(`npml翻译请求文路径：${output_path}`);