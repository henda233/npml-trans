import {FileReader} from "./file_reader.ts"

const file_reader = new FileReader();
const res = await file_reader.readFile("./npml_request_generator.ts");

console.log(res);