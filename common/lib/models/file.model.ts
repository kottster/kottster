export interface File {
  fileContent: string;
  fileName: string;

  // Path to the file (should be relative to the project root)
  // Example: src/client/pages/main/index.jsx
  filePath: string;
}
