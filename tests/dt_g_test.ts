import { RealDirectoryTreeGenerator } from "../directory_tree_generator.ts"


const generator = new RealDirectoryTreeGenerator();

console.log(await generator.generateTree("./"));