interface PageStructureFile {
  fileContent: string;
  filePath: string;
  fileName: string; 
  
  // Only when return from server
  absoluteFilePath?: string;
  
  // Whether this file is the entry file of the page (e.g. index.jsx)
  isEntryFile?: boolean;
}

export interface PageStructureDirectory {
  dirPath: string;
  dirName: string;
  files: PageStructureFile[];
  dirs: PageStructureDirectory[];
}

export interface PageStructure {
  pageId: string;
  rootDir: PageStructureDirectory;
}

export interface Page {
  id: string;
  name: string;
  icon: string;
}
