import fs from "fs";
import path from "path";
import { AppSchema, getDefaultPage, PageFileStructure, stripIndent } from "@kottster/common";
import { rimrafSync } from 'rimraf';
import { PROJECT_DIR } from "../constants/projectDir";

interface FileWriterOptions {
  usingTsc?: boolean;
}

/**
 * Service for writing files
 */
export class FileWriter {
  private readonly usingTsc: boolean;
  
  constructor(options: FileWriterOptions) {
    this.usingTsc = options.usingTsc ?? false;
  }

  /**
   * Remove page directory and all its files
   * @param pageId The page ID
   */
  public removePage(pageId: string): void {
    const dir = `${PROJECT_DIR}/app/routes/${pageId}`;

    // Check if the directory exists
    if (fs.existsSync(dir)) {
      rimrafSync(dir);
      return;
    }

    // Otherwise, check if the file with the same name exists
    ['jsx', 'tsx', 'js', 'ts'].forEach(ext => {
      const filePath = `${dir}.${ext}`;
      if (fs.existsSync(filePath)) {
        rimrafSync(filePath);
      }
    });
  }

  /**
   * Rename page directory
   * @param oldPageId The old page ID
   * @param newPageId The new page ID
   */
  public renamePage(oldPageId: string, newPageId: string): void {
    const currentDir = `${PROJECT_DIR}/app/routes/${oldPageId}`;
    const newDir = `${PROJECT_DIR}/app/routes/${newPageId}`;

    // Check if the directory exists
    if (fs.existsSync(currentDir)) {
      fs.renameSync(currentDir, newDir);
      return;
    } 

    // Otherwise, check if the file with the same name exists
    ['jsx', 'tsx', 'js', 'ts'].forEach(ext => {
      if (fs.existsSync(`${currentDir}.${ext}`)) {
        fs.renameSync(`${currentDir}.${ext}`, `${newDir}.${ext}`);
      }
    });
  }

  /**
   * Create a new page without any content
   * @param pageId The page ID
   */
  public createNewEmptyPage(pageId: string) {
    if (fs.existsSync(`${PROJECT_DIR}/app/routes/${pageId}`)) {
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
    const dir = dirPath && `${PROJECT_DIR}/${dirPath}`;
    
    // Create the directory
    if (dir) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      } else {
        this.deleteFilesInDirectory(dir);
      }
    }

    // Write the other files
    files?.forEach(file => {
      this.writeFile(`${PROJECT_DIR}/${file.filePath}`, file.fileContent);
    });

    // Write the entry file
    this.writeFile(`${PROJECT_DIR}/${entryFile.filePath}`, entryFile.fileContent);
  }

  /**
   * Write the schema to the app-schema.json file
   * @param schema The schema to write
   */
  public writeSchemaJsonFile(schema: AppSchema): void {
    const content = JSON.stringify(schema, null, 2);
    const filePath = `${PROJECT_DIR}/app-schema.json`;

    this.writeFile(filePath, content);
  }

  /**
   * Write the .env file
   * @param variables The variables to write
   */
  writeDotEnvFile(variables: Record<string, string>): void {
    const content = Object.entries(variables)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const filePath = `${PROJECT_DIR}/.env`;

    this.writeFile(filePath, content);
  }

  /**
   * Write app/.server/app.ts file with the secret key
   * @param secretKey The secret key
   */
  writeAppServerFileWithSecretKey(secretKey: string): void {
    // TODO: replace with updating the file instead of completely rewriting it
    const content = stripIndent(`
      import { createApp } from '@kottster/server';
      import { dataSourceRegistry } from './data-sources/registry';
      import schema from '../../app-schema.json';

      export const app = createApp({
        schema,
        secretKey: '${secretKey}',

        // For security, consider moving the secret key to an environment variable:
        // secretKey: process.env.NODE_ENV === 'development' ? 'dev-secret-key' : process.env.SECRET_KEY,
      });

      app.registerDataSources(dataSourceRegistry);
    `);

    const filePath = `${PROJECT_DIR}/app/.server/app.${this.usingTsc ? 'ts' : 'js'}`;
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
        fs.rmSync(fullPath, { recursive: true, force: true });
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

  /**
   * Write the content to the debug file
   * @param content The content
   */
  public writeDebugJsonFile(prefix: string, content: string): void {
    const fileDirPath = `${PROJECT_DIR}/debug`;

    // Create directory if it doesn't exist
    if (!fs.existsSync(fileDirPath)) {
      fs.mkdirSync(fileDirPath, { recursive: true });
    }

    // Save the debug info to a file
    const fileName = `${prefix}-${new Date().toISOString().replace(/:/g, '-')}.json`;
    fs.writeFileSync(`${fileDirPath}/${fileName}`, content);

    console.log(`Debug info saved: ${fileDirPath}/${fileName}`);
  }
}
