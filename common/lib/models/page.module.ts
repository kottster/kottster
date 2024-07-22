interface File {
  fileContent: string;
  filePath: string;
  fileName: string; 
  
  // Only when return from server
  absoluteFilePath?: string;
  
  // Whether this file is the entry file of the page (e.g. index.jsx)
  isEntryFile?: boolean;
}

interface Directory {
  dirPath: string;
  dirName: string;
  files: File[];
  dirs: Directory[];
}

export interface PageStructure {
  pageId: string;
  rootDir: Directory;
}

export interface Page {
  id: string;
  name: string;
  icon: string;
}
