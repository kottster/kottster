import fs from "fs";
import path from "path";
import { MainJsonSchema, Page, PageFileStructure, SidebarJsonSchema, stripIndent } from "@kottster/common";
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
   * Update the page config file
   * @param pageKey The page ID
   * @param pageConfig The page config to update
   */
  public updatePageConfig(pageKey: string, pageConfig: Page) {
    const filePath = `${PROJECT_DIR}/app/pages/${pageKey}/page.json`;

    // Create directory if it doesn't exist
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write the updated config to the file
    const updatedConfig = {
      ...pageConfig,
      key: undefined, // id should not be included in the config file, since it's derived from the directory name
    };
    fs.writeFileSync(filePath, JSON.stringify(updatedConfig, null, 2));
  }

  /**
   * Remove page directory and all its files
   * @param pageKey The page ID
   */
  public removePage(pageKey: string): void {
    const dir = `${PROJECT_DIR}/app/pages/${pageKey}`;

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
   * @param oldPageKey The old page ID
   * @param newPageKey The new page ID
   */
  public renamePage(oldPageKey: string, newPageKey: string): void {
    const currentDir = `${PROJECT_DIR}/app/pages/${oldPageKey}`;
    const newDir = `${PROJECT_DIR}/app/pages/${newPageKey}`;

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
   * Write the page to the file
   * @param page The page to write
   */
  public writePageToFile({ dirPath, files }: PageFileStructure): void {
    const dir = dirPath && `${PROJECT_DIR}/${dirPath}`;
    
    // Create the directory
    if (dir) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      } else {
        this.deleteFilesInDirectory(dir);
      }
    }

    // Write the files
    files?.forEach(file => {
      this.writeFile(`${PROJECT_DIR}/${file.filePath}`, file.fileContent);
    });
  }

  /**
   * Write the schema to the kottster-app.json file
   * @param schema The schema to write
   */
  public writeMainSchemaJsonFile(schema: MainJsonSchema): void {
    const content = JSON.stringify(schema, null, 2);
    const filePath = `${PROJECT_DIR}/kottster-app.json`;

    this.writeFile(filePath, content);
  }

  /**
   * Write the sidebar schema to the app/schemas/sidebar.json file
   * @param sidebarSchema The sidebar schema to write
   */
  public writeSidebarSchemaJsonFile(sidebarSchema: SidebarJsonSchema): void {
    const content = JSON.stringify(sidebarSchema, null, 2);
    const filePath = `${PROJECT_DIR}/app/schemas/sidebar.json`;

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
   * Write app/_server/app.ts file with the secret key
   * @param secretKey The secret key
   */
  writeAppServerFile(secretKey: string, jwtSecretSalt: string, kottsterApiToken: string | undefined, rootUsername: string, rootPassword: string): void {
    const content = stripIndent(`
      import { createApp, createIdentityProvider } from '@kottster/server';
      import schema from '../../kottster-app.json';

      /* 
       * For security, consider moving the secret data to environment variables.
       * See https://kottster.app/docs/deploying#before-you-deploy
       */
      export const app = createApp({
        schema,
        secretKey: '${secretKey}',
        ${kottsterApiToken ? `kottsterApiToken: '${kottsterApiToken}',` : ''}

        /*
         * The identity provider configuration.
         * See https://kottster.app/docs/app-configuration/identity-provider
         */
        identityProvider: createIdentityProvider('sqlite', {
          fileName: 'app.db',

          passwordHashAlgorithm: 'bcrypt',
          jwtSecretSalt: '${jwtSecretSalt}',
          
          /* The root admin user credentials */
          rootUsername: '${rootUsername}',
          rootPassword: '${rootPassword}',
        }),
      });
    `);

    const filePath = `${PROJECT_DIR}/app/_server/app.${this.usingTsc ? 'ts' : 'js'}`;
    this.writeFile(filePath, content);
  }

  /**
   * Remove data source directory
   * @param dataSourceName The data source name
   */
  public removeDataSource(dataSourceName: string): void {
    const dir = `${PROJECT_DIR}/app/_server/data-sources/${dataSourceName}`;

    // Check if the directory exists
    if (fs.existsSync(dir)) {
      rimrafSync(dir);
      return;
    }
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
