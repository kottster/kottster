import fs from "fs";
import { PROJECT_DIR } from "../constants/projectDir";
import path from "path";
import { AppSchema, PageStructure, ProcedureStructure } from "@kottster/common";

/**
 * Service to read files
 */
export class FileReader {

  /**
   * Read the schema.json file
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
   */
  public getPagesDirectories(): string[] {
    const dir = `${PROJECT_DIR}/src/client/pages`;
    if (!fs.existsSync(dir)) {
      return [];
    }

    return this.getDirectorySubdirectories(dir);
  }

  // TODO: Implement getPageStructure properly
  /**
   * Get page structure
   */
  public getPageStructure(pageId: string): PageStructure {
    const dir = `${PROJECT_DIR}/src/client/pages/${pageId}`;
    if (!fs.existsSync(dir)) {
      return {
        pageId,
        rootDir: {
          dirName: pageId,
          dirPath: `src/client/pages/${pageId}`,
          files: [],
          dirs: []
        }
      };
    }

    const files = this.getDirectoryFiles(dir);

    const pageStructure: PageStructure = {
      pageId,
      rootDir: {
        dirName: pageId,
        dirPath: `src/client/pages/${pageId}`,
        files: files.map((file) => ({
          fileName: file,
          filePath: `src/client/pages/${pageId}/${file}`,
          fileContent: fs.readFileSync(`${dir}/${file}`, 'utf8'),
          absoluteFilePath: `${dir}/${file}`,
          isEntryFile: true
        })),
        dirs: []
      }
    };

    return pageStructure;
  }

  /**
   * Get procedure structures
   */
  public getProcedureStructures(): ProcedureStructure[] {
    const dir = `${PROJECT_DIR}/src/server/procedures`;
    const files = this.getDirectoryFiles(dir);
    
    return files.map((file) => {
      const filePath = `src/server/procedures/${file}`;
      
      return {
        procedureName: file.split('.')[0],
        file: {
          fileName: file,
          filePath,
          fileContent: fs.readFileSync(`${PROJECT_DIR}/${filePath}`, 'utf8'),
          absoluteFilePath: `${dir}/${file}`,
        }
      }
    });
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
