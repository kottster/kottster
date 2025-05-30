import fs from "fs";
import { PROJECT_DIR } from "../constants/projectDir";
import path from "path";
import { PageFileStructure, File, AppSchema } from "@kottster/common";

/**
 * Service for reading files
 */
export class FileReader {

  /**
   * Read the schema from the kottster-app.json file
   */
  public readSchemaJsonFile(): AppSchema {
    const filePath = `${PROJECT_DIR}/kottster-app.json`;
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Read the package.json file
   * @returns The package.json content
   */
  public readPackageJson(): unknown {
    const filePath = `${PROJECT_DIR}/package.json`;
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Get existing page directories
   * @returns The page directories
   */
  public getPagesDirectories(): string[] {
    const dir = `${PROJECT_DIR}/app/pages`;
    if (!fs.existsSync(dir)) {
      return [];
    }

    return this.getDirectorySubdirectories(dir);
  }

  /**
   * Get page structure
   * @param pageId The page ID
   * @returns The page structure or null if the page does not exist
   */
  public getPageFileStructure(pageId: string): PageFileStructure | null {
    const dirPath = `app/pages/${pageId}`;
    const absoluteDirPath = `${PROJECT_DIR}/${dirPath}`;
    
    // Get the entry file path
    let entryFilePath = fs.existsSync(`${absoluteDirPath}.tsx`) ? `${absoluteDirPath}.tsx` : `${absoluteDirPath}.jsx`;
    if (!fs.existsSync(entryFilePath)) {
      entryFilePath = fs.existsSync(`${absoluteDirPath}/index.tsx`) ? `${absoluteDirPath}/index.tsx` : `${absoluteDirPath}/index.jsx`;
    }
    if (!fs.existsSync(entryFilePath)) {
      return null;
    }
    
    const filePaths = this.getAllFilePathsInDirectory(absoluteDirPath);
    const entryFile: File = this.getFileByPath(entryFilePath);
    const files: File[] = filePaths.map((filePath) => this.getFileByPath(filePath)).filter((file) => file.filePath !== entryFilePath);

    const pageStructure: PageFileStructure = {
      pageId,
      dirPath,
      entryFile,
      files,
    };

    return pageStructure;
  }

  /**
   * Get all file paths in a directory
   * @param dirPath The directory path
   * @returns The file paths
   */
  private getAllFilePathsInDirectory(dirPath: string): string[] {
    // Check if the directory exists
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    
    const files: string[] = [];
  
    function traverseDir(currentPath: string) {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
  
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          traverseDir(fullPath);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    }
  
    traverseDir(dirPath);
    return files;
  }

  /**
   * Get file by path
   * @param absoluteFilePath The absolute file path
   * @returns The file object
   */
  private getFileByPath(absoluteFilePath: string): File {
    // Get the relative file path
    const filePath = path.relative(PROJECT_DIR, absoluteFilePath);
    
    return {
      fileName: path.basename(filePath),
      filePath,
      fileContent: fs.readFileSync(filePath, 'utf8'),
      absoluteFilePath,
    };
  }

  /**
   * Get existing subdirectories in the directory
   * @param directory The directory
   * @returns The subdirectories in the directory
   */
  private getDirectorySubdirectories(directory: string): string[] {
    if (!fs.existsSync(directory)) {
      return [];
    }

    return fs.readdirSync(directory).filter((file) => {
      return fs.statSync(path.join(directory, file)).isDirectory();
    });
  }
}
