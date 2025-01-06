export interface File {
  fileContent: string;
  fileName: string;

  /** Path to the file (should be relative to the project root) */
  filePath: string;

  /** Absolute path to the file (with project root) */
  absoluteFilePath?: string;
}
