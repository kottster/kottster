import fs from 'fs/promises';
import path from 'path';
import { transformToCamelCaseVarName } from '../utils/transformToCamelCaseVarName';

interface AutoImportOptions {
  projectDir?: string;
  usingTsc: boolean;
}

/**
 * A service that create import/export files for given directory
 */
export class AutoImport {
  private readonly projectDir: string;
  private readonly usingTsc: boolean;
  
  get jsExt () {
    return this.usingTsc ? 'ts' : 'js';
  }
  get jsxExt () {
    return this.usingTsc ? 'tsx' : 'jsx';
  }
  
  constructor (options?: AutoImportOptions) {
    this.projectDir = options?.projectDir || process.cwd();
    this.usingTsc = options?.usingTsc ?? false;
  }

  readonly AUTO_GENERATED_COMMENT = '// This file is auto-generated. Do not modify it manually.';

  /**
   * Generate file that exports all the trpc routers (app/routes/../api.server.ts).
   */
  public async createPageRoutersFile(): Promise<void> {
    const filePath = path.join(this.projectDir, 'app/.server/trpc-routers', `page-routers.generated.${this.jsExt}`);
    const pagesDir = path.join(this.projectDir, 'app/routes');
    const routerPaths = await this.findPageApiFiles(pagesDir);

    const routers = routerPaths.map(routerPath => {
      const dirName = path.basename(path.dirname(routerPath));
      
      return {
        filePath: path.relative(path.join(this.projectDir, 'app/.server/trpc-routers'), routerPath),
        dirName
      }
    });
    
    const comment = `${this.AUTO_GENERATED_COMMENT}\n// It exports all api.server.(ts|tsx) files in the app/routes directory.`;
    const exports = routers.map(({ filePath, dirName }) => ({
      varName: transformToCamelCaseVarName(dirName),
      importFrom: filePath.replace(/\\/g, '/').replace(/\.(ts|js)$/, '')
    }));
    const fileContent = `${comment}\n\n${this.getExportFileContent(exports)}`;
    
    await this.writeFile(filePath, fileContent);
  }

  /**
   * Recursively find all api.server.ts and api.server.js files in the given directory.
   * @param dir The directory to search in.
   * @returns An array of file paths.
   */
  private async findPageApiFiles(dir: string): Promise<string[]> {
    const files = await fs.readdir(dir, { withFileTypes: true });
    const results: string[] = [];

    for (const file of files) {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        results.push(...await this.findPageApiFiles(filePath));
      } else if (file.name === `api.server.${this.jsExt}`) {
        results.push(filePath);
      }
    }

    return results;
  }

  /**
   * Get the content of a file that imports/exports the given variables.
   * @param exports The variables to export.
   */
  private getExportFileContent (exports: { varName: string; importFrom: string; }[]) {
    const imports = exports.map(({ varName, importFrom }) => `import ${varName} from '${importFrom}';`);
    const exportsContent = exports.map(({ varName }) => `  ${varName},`).join('\n');
    return `${imports.join('\n')}\n\nexport default {\n${exportsContent}\n}`;
  }

  /**
   * Write content to a file.
   * @param filePath The path of the file to write to.
   * @param content The file content.
   */
  private async writeFile (filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content);
    } catch (error) {
      console.error(`Error creating ${filePath} file:`, error);
    }
  }
}