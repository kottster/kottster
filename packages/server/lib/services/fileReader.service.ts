import fs from "fs";
import { PROJECT_DIR } from "../constants/projectDir";
import path from "path";
import { PageFileStructure, File, AppSchema } from "@kottster/common";

/**
 * Service for reading files
 */
export class FileReader {

  /**
   * Read the schema from the app-schema.json file
   */
  public readSchemaJsonFile(): AppSchema {
    const filePath = `${PROJECT_DIR}/app-schema.json`;
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
    const baseFilename = `${PROJECT_DIR}/app/routes/${pageId}`;
    const entryFilePath = fs.existsSync(`${baseFilename}.tsx`) ? `${baseFilename}.tsx` : `${baseFilename}.jsx`;

    if (!fs.existsSync(entryFilePath)) {
      return null;
    }

    const entryFile: File = this.getFileByPath(entryFilePath);
    const pageStructure: PageFileStructure = {
      pageId,
      dirPath: `app/routes/${pageId}`,
      entryFile,
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
