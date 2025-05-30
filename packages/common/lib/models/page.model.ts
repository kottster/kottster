import { File } from './file.model'

export interface PageFileStructure {
  pageId: string;

  // Root directory of the page
  // Example: src/client/pages/<pageId>
  dirPath?: string;

  // Entry file of the page
  // Example: src/client/pages/<pageId>/index.jsx
  entryFile: File;
  
  // Files in the page directory, does not include entry file
  files?: File[];
}
