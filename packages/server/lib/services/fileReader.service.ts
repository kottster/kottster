import fs from "fs";
import { PROJECT_DIR } from "../constants/projectDir";
import path from "path";
import { PageFileStructure, File, AppSchema, Page, DataSource } from "@kottster/common";

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
   * Get existing data source directories
   * @returns The data source directories
   */
  public getDataSourceDirectories(): string[] {
    const dir = `${PROJECT_DIR}/app/_server/data-sources`;
    if (!fs.existsSync(dir)) {
      return [];
    }

    return this.getDirectorySubdirectories(dir);
  }

  /**
   * Get existing data source configs
   * @returns The data source configs
   */
  public getDataSourceConfigs(): Omit<DataSource, 'status' | 'adapter'>[] {
    const dataSourceDirectories = this.getDataSourceDirectories();
    const result: Omit<DataSource, 'status' | 'adapter'>[] = [];

    for (const dir of dataSourceDirectories) {
      const dataSourceJsonPath = path.join(PROJECT_DIR, `app/_server/data-sources/${dir}/dataSource.json`);
      if (!fs.existsSync(dataSourceJsonPath)) {
        console.warn(`Data source config not found for directory: ${dir}`);
        continue;
      }

      try {
        const content = fs.readFileSync(dataSourceJsonPath, 'utf8');
        const config = JSON.parse(content);
        result.push({ 
          version: config.version,
          name: dir, 
          type: config.type,
          tablesConfig: config.tablesConfig || {},
        });
      } catch (error) {
        console.warn(`Error reading data source config for directory ${dir}:`, error);
      }
    }

    return result;
  }

  /**
   * Get existing page configs
   * @returns The page configs
   */
  public getPageConfigs(): Page[] {
    const pageDirectories = this.getPagesDirectories();
    const result: Page[] = [];

    for (const pageKey of pageDirectories) {
      const pageFileStructure = this.getPageFileStructure(pageKey);
      if (!pageFileStructure) {
        console.warn(`Page structure not found for page: ${pageKey}`);
        continue;
      }
      
      const pageJsonFile = pageFileStructure?.files?.find((f) => f.fileName === 'page.json');
      if (!pageJsonFile) {
        console.warn(`Page JSON file not found for page: ${pageFileStructure?.pageKey}`);
        continue;
      }

      try {
        const pageJsonContent = JSON.parse(pageJsonFile.fileContent) as Omit<Page, 'id'>;
        
        result.push({
          ...pageJsonContent,
          key: pageFileStructure.pageKey,
        } as Page);
      } catch (error) {
        console.warn(`Error parsing page JSON file for page: ${pageFileStructure?.pageKey}. Error: ${error.message}`);
        continue;
      }
    }

    return result;
  }

  /**
   * Get page structure
   * @param pageKey The page ID
   * @returns The page structure or null if the page does not exist
   */
  public getPageFileStructure(pageKey: string): PageFileStructure | null {
    const dirPath = `app/pages/${pageKey}`;
    const absoluteDirPath = `${PROJECT_DIR}/${dirPath}`;
    
    const filePaths = this.getAllFilePathsInDirectory(absoluteDirPath);
    const files: File[] = filePaths.map((filePath) => this.getFileByPath(filePath));

    const pageStructure: PageFileStructure = {
      pageKey,
      dirPath,
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
