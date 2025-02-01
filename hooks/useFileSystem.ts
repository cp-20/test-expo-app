import {
  DocumentDirectoryPath,
  readDir,
  readFile,
  stat,
} from "react-native-fs";

const readFileSystem = async () => {
  // get a list of files and directories in the main bundle
  const result = await readDir(DocumentDirectoryPath);
  console.log("GOT RESULT", result);

  // stat the first file
  const statResult = await Promise.all([
    stat(result[0].path),
    result[0].path,
  ]);
  if (statResult[0].isFile()) {
    // if we have a file, read it
    return await readFile(statResult[1], "utf8");
  }
  if (statResult[0].isDirectory()) {
    // if we have a directory, list it
    // return await rnfs.readDir(statResult[1]);
    console.log("is directory", statResult[1]);

    return [];
  }

  return "no file";
};

export const useFileSystem = () => {
  return { readFileSystem };
};
