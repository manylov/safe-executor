import * as fs from "fs";
import * as path from "path";

export function node_url(networkName: string): string {
  if (networkName) {
    const uri = process.env[networkName.toUpperCase() + "_NODE_URI"];
    if (uri && uri !== "") {
      return uri;
    }
  }

  if (networkName === "localhost") {
    // do not use ETH_NODE_URI
    return "http://localhost:8545";
  }

  throw new Error("Fork network is unknown");
}

export const getContractsPathsFromDeps = (depsPath: string): string[] => {
  const pathToContracts = path.resolve(process.cwd(), "node_modules", depsPath);
  const excludeDir = "test";
  const files = getAllSolFiles(pathToContracts, excludeDir);
  return files;
};

function getAllSolFiles(rootDirPath: string, excludeDir: string): string[] {
  const solFiles: string[] = [];

  const traverseDirectory = (dirPath: string, excludeDir: string) => {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);

      if (fs.statSync(filePath).isDirectory()) {
        if (file !== excludeDir) {
          traverseDirectory(filePath, excludeDir);
        }
      } else if (path.extname(filePath) === ".sol") {
        solFiles.push(filePath);
      }
    }
  };

  traverseDirectory(rootDirPath, excludeDir);

  // get files started from package folder
  return solFiles.map((filePath) => {
    const nodeModulesIndex = filePath.indexOf("node_modules");
    if (nodeModulesIndex !== -1) {
      return filePath.slice(nodeModulesIndex + "node_modules".length + 1);
    }
    return filePath;
  });
}
