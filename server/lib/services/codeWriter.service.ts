import fs from "fs";
import { PROJECT_DIR } from "../constants/projectDir";
import path from "path";
import { AppSchema, PageStructure, ProcedureStructure, getDefaultPage } from "@kottster/common";

/**
 * Service to write code to a file
 */
export class CodeWriter {

  /**
   * Write the procedures to the file
   * @param procedures The procedures to write
   */
  public writeProceduresToFile(procedures: ProcedureStructure[]): void {
    this.removeFilesInDirectory(`${PROJECT_DIR}/src/server/procedures`);

    // Create a file for each procedure
    procedures.forEach(procedure => {
      this.writeProcedureToFile(procedure);
    });
  }

  private writeProcedureToFile(procedure: ProcedureStructure): void {
    console.debug('writeProcedureToFile', procedure);
    this.writeFile(`${PROJECT_DIR}/${procedure.file.filePath}`, procedure.file.fileContent);
  }

  /**
   * Remove page directory and all its files
   * @param pageId The page ID
   */
  public removePageDirectory(pageId: string): void {
    const dir = `${PROJECT_DIR}/src/client/pages/${pageId}`;
    if (!fs.existsSync(dir)) {
      return;
    }

    fs.rmdirSync(dir, { recursive: true });
  }

  /**
   * Create a new page without any content
   * @param pageId The page ID
   */
  public createNewEmptyPage(pageId: string) {
    if (fs.existsSync(`${PROJECT_DIR}/src/client/pages/${pageId}`)) {
      return;
    }

    const newPage = getDefaultPage(pageId);
    this.writePageToFile(newPage);
  }

  /**
   * Write the page to the file
   * @param page The page to write
   */
  public writePageToFile({ rootDir }: PageStructure): void {
    const dir = `${PROJECT_DIR}/${rootDir.dirPath}`;
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // For each file in the page, write the file
    rootDir.files.forEach(file => {
      this.writeFile(`${PROJECT_DIR}/${file.filePath}`, file.fileContent);
    });
  }

  /**
   * Write the schema to the schema.json file
   * @param schema The schema to write
   */
  public writeSchemaJsonFile(schema: AppSchema): void {
    const content = JSON.stringify(schema, null, 4);
    const filePath = `${PROJECT_DIR}/src/__generated__/schema.json`;

    this.writeFile(filePath, content);
  }

  private removeFilesInDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      return;
    }
  
    const entries = fs.readdirSync(dir, { withFileTypes: true });
  
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
  
      if (entry.isDirectory()) {
        this.removeFilesInDirectory(fullPath);
        fs.rmdirSync(fullPath);
      } else {
        fs.unlinkSync(fullPath);
      }
    }
  }

  private writeFile(filePath: string, content: string): void {
    const fileDirPath = filePath.replace(/\/[^/]+$/, '');

    // Create directory if it doesn't exist
    if (!fs.existsSync(fileDirPath)) {
      fs.mkdirSync(fileDirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
  }
}
