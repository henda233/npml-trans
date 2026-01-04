import {GenerationOptions, NpmlRequestGenerator} from "./npml_request_generator.ts";
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
const result = await npml_request_generator.generateRequest("./npml/1-4.npml",options);

console.log(result);