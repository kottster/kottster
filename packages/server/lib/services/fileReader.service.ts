import fs from "fs";
import { PROJECT_DIR } from "../constants/projectDir";
import path from "path";
import { PageFileStructure, File } from "@kottster/common";

/**
 * Service for reading files
 */
export class FileReader {

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
    const dir = `${PROJECT_DIR}/app/routes`;
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
    const dir = `${PROJECT_DIR}/app/routes/${pageId}`;
    const entryFilePath = fs.existsSync(`${dir}/index.tsx`) ? `${dir}/index.tsx` : `${dir}/index.jsx`;

    if (!fs.existsSync(dir)) {
      return null;
    }

    // Get all files in the directory, except the entry file
    const dirFilePaths = this.getAllFilePathsInDirectory(dir).filter((filePath) => filePath !== entryFilePath);

    const entryFile: File = this.getFileByPath(entryFilePath);
    const files = dirFilePaths.map((filePath) => this.getFileByPath(filePath));

    const pageStructure: PageFileStructure = {
      pageId,
      dirPath: `app/routes/${pageId}`,
      entryFile,
      files
    };

    return pageStructure;
  }

  /**
   * Get all file paths in a directory
   * @param dirPath The directory path
   * @returns The file paths
   */
  private getAllFilePathsInDirectory(dirPath: string): string[] {
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
