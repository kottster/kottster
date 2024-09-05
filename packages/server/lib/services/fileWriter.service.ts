import fs from "fs";
import { PROJECT_DIR } from "../constants/projectDir";
import path from "path";
import { AppSchema, getDefaultPage, PageFileStructure } from "@kottster/common";

interface FileWriterOptions {
  usingTsc: boolean;
}

/**
 * Service for writing files
 */
export class FileWriter {
  private readonly usingTsc: boolean;
  
  constructor(options: FileWriterOptions) {
    this.usingTsc = options.usingTsc;
  }

  /**
   * Remove page directory and all its files
   * @param pageId The page ID
   */
  public removePageDirectory(pageId: string): void {
    const dir = `${PROJECT_DIR}/src/app/pages/${pageId}`;
    if (!fs.existsSync(dir)) {
      return;
    }

    fs.rmdirSync(dir, { recursive: true });
  }

  /**
   * Rename page directory
   * @param oldPageId The old page ID
   * @param newPageId The new page ID
   */
  public renamePageDirectory(oldPageId: string, newPageId: string): void {
    const oldDir = `${PROJECT_DIR}/src/app/pages/${oldPageId}`;
    const newDir = `${PROJECT_DIR}/src/app/pages/${newPageId}`;

    if (!fs.existsSync(oldDir)) {
      return;
    }

    fs.renameSync(oldDir, newDir);
  }

  /**
   * Create a new page without any content
   * @param pageId The page ID
   */
  public createNewEmptyPage(pageId: string) {
    if (fs.existsSync(`${PROJECT_DIR}/src/app/pages/${pageId}`)) {
      return;
    }

    const newPage = getDefaultPage(pageId, this.usingTsc);
    this.writePageToFile(newPage);
  }

  /**
   * Write the page to the file
   * @param page The page to write
   */
  public writePageToFile({ dirPath, entryFile, files }: PageFileStructure): void {
    const dir = `${PROJECT_DIR}/${dirPath}`;
    
    // Create the directory
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    } else {
      this.deleteFilesInDirectory(dir);
    }

    // Write the other files
    files.forEach(file => {
      this.writeFile(`${PROJECT_DIR}/${file.filePath}`, file.fileContent);
    });

    // Write the entry file
    this.writeFile(`${PROJECT_DIR}/${entryFile.filePath}`, entryFile.fileContent);
  }

  /**
   * Delete the page directory
   * @param pageId The page ID
   */
  deletePageDirectory(page: PageFileStructure): void {
    const dir = `${PROJECT_DIR}/${page.dirPath}`;
    if (!fs.existsSync(dir)) {
      return;
    }

    fs.rmdirSync(dir, { recursive: true });
  }

  /**
   * Write the schema to the schema.json file
   * @param schema The schema to write
   */
  public writeSchemaJsonFile(schema: AppSchema): void {
    const content = JSON.stringify(schema, null, 4);
    const filePath = `${PROJECT_DIR}/schema.json`;

    this.writeFile(filePath, content);
  }

  /**
   * Delete all files in the directory
   * @param dir The directory
   */
  private deleteFilesInDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      return;
    }
  
    const entries = fs.readdirSync(dir, { withFileTypes: true });
  
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
  
      if (entry.isDirectory()) {
        this.deleteFilesInDirectory(fullPath);
        fs.rmdirSync(fullPath);
      } else {
        fs.unlinkSync(fullPath);
      }
    }
  }

  /**
   * Write the content to the file
   * @param filePath The file path
   * @param content The content
   */
  private writeFile(filePath: string, content: string): void {
    const fileDirPath = filePath.replace(/\/[^/]+$/, '');

    // Create directory if it doesn't exist
    if (!fs.existsSync(fileDirPath)) {
      fs.mkdirSync(fileDirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
  }
}
