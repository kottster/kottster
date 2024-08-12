import fs from 'fs';
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
   * Add file that exports all the procedures in the src/server/procedures directory
   */
  public createServerProceduresFile (): void {
    const filePath = path.join(this.projectDir, 'src/__generated__/server', `procedures.generated.${this.jsExt}`);
    const procedureFilenames = fs.readdirSync(path.join(this.projectDir, 'src/server/procedures'));
    const procedures = procedureFilenames
      .filter(filename => filename.endsWith(`.${this.jsExt}`))
      .map(filename => {
        const procedureName = filename.split('.')[0];
        
        return {
          varName: transformToCamelCaseVarName(procedureName),
          procedureName,
        }
      });
    
    const comment = `${this.AUTO_GENERATED_COMMENT} \n// It automatically exports all the procedures in the src/server/procedures directory.`;
    const exports = procedures.map(({ procedureName, varName }) => ({
      varName,
      importFrom: `../../server/procedures/${procedureName}`
    }));
    const fileContent = `${comment}\n\n${this.getExportFileContent(exports)}`;
    
    this.createDir('src/__generated__/server');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Add file that exports all the pages in the src/client/pages directory
   */
  public createClientPagesFile (ignorePageIds: string[] = []): void {
    const filePath = path.join(this.projectDir, 'src/__generated__/client', `pages.generated.${this.jsExt}`);
    const pagesFilenames = fs.readdirSync(path.join(this.projectDir, 'src/client/pages'));
    const pages = pagesFilenames
      .map(page => {
        const pageId = page.split('.')[0];

        return {
          pageId,
          varName: transformToCamelCaseVarName(pageId),
        }
      })
      .filter(({ pageId }) => !ignorePageIds.includes(pageId))
    
    const comment = `${this.AUTO_GENERATED_COMMENT} \n// It automatically exports all the pages in the src/client/pages directory.`;
    const exports = pages
      .map(({ pageId, varName }) => ({
        varName,
        importFrom: `../../client/pages/${pageId}/index`
      }));
    const fileContent = `${comment}\n\n${this.getExportFileContent(exports)}`;

    this.createDir('src/__generated__/client');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Create a directory
   */
  private createDir (dirName: string): void {
    // Skip if directory already exists
    if (dirName && fs.existsSync(path.join(this.projectDir, dirName))) {
      return;
    }
    
    try {
      const dirPath = path.join(this.projectDir, dirName);
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (error) {
      console.error(`Error creating ${dirName} directory:`, error)
    }
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
   * Write content to a file
   */
  private writeFile (filePath: string, content: string): void {
    try {
      fs.writeFileSync(filePath, content)
    } catch (error) {
      console.error(`Error creating ${filePath} file:`, error)
    }
  }
}
