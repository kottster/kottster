import fs from "fs";
import { PROJECT_DIR } from "../constants/projectDir";
import path from "path";
import { AppSchema, PageFileStructure, ProcedureFileStructure, File } from "@kottster/common";

/**
 * Service for reading files
 */
export class FileReader {

  /**
   * Read the schema.json file
   * @returns The app schema
   */
  public readSchemaJson(): AppSchema {
    const filePath = `${PROJECT_DIR}/src/__generated__/schema.json`;
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
    const dir = `${PROJECT_DIR}/src/client/pages`;
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
    const dir = `${PROJECT_DIR}/src/client/pages/${pageId}`;
    const entryFilePath = `${dir}/index.jsx`;

    if (!fs.existsSync(dir)) {
      return null;
    }

    // Get all files in the directory, except the entry file
    const dirFilePaths = this.getAllFilePathsInDirectory(dir).filter((filePath) => filePath !== entryFilePath);

    const entryFile: File = this.getFileByPath(entryFilePath);
    const files = dirFilePaths.map((filePath) => this.getFileByPath(filePath));

    const pageStructure: PageFileStructure = {
      pageId,
      dirPath: `src/client/pages/${pageId}`,
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
   * Get procedure structures
   */
  public getProcedureFileStructures(): ProcedureFileStructure[] {
    const dir = `${PROJECT_DIR}/src/server/procedures`;
    const files = this.getDirectoryFiles(dir);
    const filePaths = files.map((file) => `${dir}/${file}`);
    
    return filePaths.map((filePath) => {
      const file = this.getFileByPath(filePath);

      return {
        procedureName: this.getProcedureNameFromFileName(file.fileName),
        entryFile: file
      } as ProcedureFileStructure;
    });
  }

  /**
   * Get procedure structure
   * @param procedureName The procedure name
   * @returns The procedure structure or null if the procedure does not exist
   */
  private getProcedureNameFromFileName(fileName: string): string {
    return fileName.split('.')[0];
  }

  /**
   * Get existing files in the directory
   * @param directory The directory
   * @returns The filenames in the directory
   */
  private getDirectoryFiles(directory: string): string[] {
    if (!fs.existsSync(directory)) {
      return [];
    }
    
    return fs.readdirSync(directory);
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
