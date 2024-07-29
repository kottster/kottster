import path from 'path'
import fs from 'fs'
import { AppSchema, DataSourceType, transformToCamelCaseVarName } from '@kottster/common'
import { FileTemplateManager } from './fileTemplateManager.service'
import dataSourcesTypeData from '../constants/dataSourceTypeData'

interface CreateProjectOptions {
  projectName: string
  appId: string
  secretKey: string
}

interface PackageJsonOptions {
  name: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

type EnvOptions = {
  key: string;
  comment?: string;
  value: string;
}[];

/**
 * Service for creating files in the project.
 */
export class FileCreator {
  constructor (
    private readonly PROJECT_DIR: string = process.cwd()
  ) {}

  readonly AUTO_GENERATED_COMMENT = '// This file is auto-generated. Do not modify it manually.';

  /**
   * Create a new project files.
   * @param options The new project options.
   */
  public createProject (options: CreateProjectOptions): void {
    // Check if project directory already exists
    if (fs.existsSync(this.PROJECT_DIR) && options.projectName !== '.') {
      throw new Error(`Project directory already exists: ${this.PROJECT_DIR}`)
    };

    // Create directories
    this.createDir()
    this.createDir('src')
    this.createDir('src/client')
    this.createDir('src/client/pages')
    this.createDir('src/__generated__/client')
    this.createDir('src/server')
    this.createDir('src/server/procedures')

    // Create root files
    this.createPackageJson({ 
      name: options.projectName,
      dependencies: {}
    })
    this.createEnv([
      {
        key: 'APP_ID',
        comment: 'The ID of the Kottster app',
        value: options.appId,
      },
      {
        key: 'PORT',
        comment: 'Port to run the server on',
        value: '5480',
      },
      {
        key: 'SECRET_KEY',
        comment: 'Private key for obtaining a JWT secret during server startup',
        value: options.secretKey,
      },
    ])
    this.createGitIgnore()
    this.createDockerfile()
    this.createViteConfig()

    // Create files
    this.createClientIndex()
    this.createServerMain()
    this.createServerApp()

    this.addServerProcedures()
    this.addClientPages()
    this.createSchema()
  }

  /**
   * Add a data source to the project.
   * @param dataSourceType The type of the data source.
   */
  public addDataSource (dataSourceType: DataSourceType): void {
    const dataSourceTypeData = dataSourcesTypeData[dataSourceType];
    const { fileTemplateName } = dataSourceTypeData;

    // Create directory
    this.createDir(`src/server/data-sources/${dataSourceType}`)

    // Create file
    const filePath = path.join(this.PROJECT_DIR, `src/server/data-sources/${dataSourceType}`, `index.js`)
    const fileContent = FileTemplateManager.getTemplate(fileTemplateName);
    this.writeFile(filePath, fileContent)

    // Update src/server/main.js
    const mainFilePath = path.join(this.PROJECT_DIR, 'src/server', 'main.js')
    let mainFileContent = fs.readFileSync(mainFilePath, 'utf8')
    mainFileContent = this.addImportsToFileContent(mainFileContent, [
      `${dataSourceType}DataSource from './data-sources/${dataSourceType}'`
    ]);
    mainFileContent = this.addCodeBeforeAppStart(mainFileContent, `app.registerDataSources([\n  ${dataSourceType}DataSource,\n]);`);
    this.writeFile(mainFilePath, mainFileContent)
  }

  /**
   * Get the content of a file that imports/exports the given variables.
   * @param exports The variables to export.
   */
  public getExportFileContent (exports: { varName: string; importFrom: string; }[]) {
    const imports = exports.map(({ varName, importFrom }) => `import ${varName} from '${importFrom}';`);
    const exportsContent = exports.map(({ varName }) => `  ${varName},`).join('\n');
    return `${imports.join('\n')}\n\nexport default {\n${exportsContent}\n}`;
  }

  /**
   * Add files that exports all the procedures in the src/server/procedures directory
   */
  public addServerProcedures (): void {
    const filePath = path.join(this.PROJECT_DIR, 'src/__generated__/server', 'procedures.generated.js');
    const procedureFilenames = fs.readdirSync(path.join(this.PROJECT_DIR, 'src/server/procedures'));
    const procedures = procedureFilenames.filter(filename => filename.endsWith('.js')).map(filename => filename.split('.')[0]);
    const proceduresVarNames = procedures.map(procedure => transformToCamelCaseVarName(procedure));    
    
    const comment = `${this.AUTO_GENERATED_COMMENT} \n// It automatically exports all the procedures in the src/server/procedures directory.`;
    const exports = procedures.map((procedure, i) => ({
      varName: proceduresVarNames[i],
      importFrom: `../../server/procedures/${procedure}.js`
    }));
    const fileContent = `${comment}\n\n${this.getExportFileContent(exports)}`;
    
    this.createDir('src/__generated__/server');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Add files that exports all the pages in the src/client/pages directory
   */
  public addClientPages (): void {
    const filePath = path.join(this.PROJECT_DIR, 'src/__generated__/client', 'pages.generated.js');
    const pages = fs.readdirSync(path.join(this.PROJECT_DIR, 'src/client/pages'));
    const pagesVarNames = pages.map(page => transformToCamelCaseVarName(page));
    
    const comment = `${this.AUTO_GENERATED_COMMENT} \n// It automatically exports all the pages in the src/client/pages directory.`;
    const exports = pages.map((page, i) => ({
      varName: pagesVarNames[i],
      importFrom: `../../client/pages/${page}/index.jsx`
    }));
    const fileContent = `${comment}\n\n${this.getExportFileContent(exports)}`;

    this.createDir('src/__generated__/client');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Add a code snippet before the app.start function in the given file content.
   * @description Can only be used for the src/server/main.js file content.
   * @param fileContent The file content.
   * @param codeToAdd The code snippet to add.
   * @returns The updated file content.
   */
  private addCodeBeforeAppStart(fileContent: string, codeToAdd: string): string {
    const appStartPattern = /app\.start\s*\(/;
    const match = fileContent.match(appStartPattern);
  
    if (!match) {
      throw new Error("Couldn't find 'app.start' in the file content");
    }
  
    const insertPosition = match.index!;
  
    const updatedContent = 
      fileContent.slice(0, insertPosition) + 
      codeToAdd + 
      '\n\n' + 
      fileContent.slice(insertPosition);
  
    return updatedContent;
  }

  /**
   * Add import statements to the given file content.
   * @param fileContent The file content.
   * @param imports The import statements to add.
   * @returns The updated file content.
   */
  private addImportsToFileContent(fileContent: string, imports: string[]): string {
    // Find the last import statement in the file
    const lastImportIndex = fileContent.lastIndexOf('import');
    const lastImportLineEnd = fileContent.indexOf('\n', lastImportIndex);
    
    // If no imports found, insert at the beginning of the file
    const insertPosition = lastImportIndex !== -1 ? lastImportLineEnd + 1 : 0;
    
    // Create the new import statements
    const newImports = imports.map(imp => `import ${imp};`).join('\n');
    
    // Insert the new imports
    const updatedContent = 
      fileContent.slice(0, insertPosition) + 
      newImports + 
      '\n' +
      fileContent.slice(insertPosition);
    
    return updatedContent;
  }

  /**
   * Create a package.json file
   * @param options The package.json content
   */
  private createPackageJson (options: PackageJsonOptions) {
    const packageJsonPath = path.join(this.PROJECT_DIR, 'package.json')

    const packageJson = {
      name: options.name,
      type: 'module',
      version: options.version || '1.0.0',
      scripts: {
        'start:prod': 'kottster start src/server/main.js',
        'start:dev': 'kottster start src/server/main.js --development',
        'dev:add-data-source': 'kottster add-data-source',
        postinstall: 'npm install @kottster/cli@^1.x -g'
      },
      engines: {
        node: '>=18.0.0'
      },
      dependencies: {
        '@kottster/common': process.env.KOTTSTER_COMMON_DEP_VER ?? '^1.x',
        '@kottster/cli': process.env.KOTTSTER_CLI_DEP_VER ?? '^2.x',
        '@kottster/server': process.env.KOTTSTER_BACKEND_DEP_VER ?? '^1.x',
        '@kottster/react': process.env.KOTTSTER_REACT_DEP_VER ?? '^0.x',
        'react': '^18.x',
        'react-dom': '^18.x',
        'antd': '^5.x',
        '@ant-design/icons': '^5.x',
        ...(options.dependencies ?? {}),
      },
      devDependencies: {
        'vite': '^5.x',
        '@vitejs/plugin-react': '^4.x',
        ...(options.devDependencies ?? {}),
      }
    }
    const packageJsonContent = JSON.stringify(packageJson, null, 2)

    this.writeFile(packageJsonPath, packageJsonContent)
  }

  /**
   * Create a .env file
   * @param options The .env variables
   */
  private createEnv (options: EnvOptions): void {
    const envPath = path.join(this.PROJECT_DIR, '.env')
    const envContent = options.map(({ key, comment, value }) => {
      return `${comment ? `# ${comment}\n` : ''}${key}=${value}`
    }).join('\n\n') + '\n';

    this.writeFile(envPath, envContent)
  }

  /**
   * Create a .gitignore file
   */
  private createGitIgnore (): void {
    const gitIgnorePath = path.join(this.PROJECT_DIR, '.gitignore')
    const gitIgnoreContent = ['node_modules', 'nbuild', 'npm-debug.log', '.DS_Store', 'dist'].join('\n')

    this.writeFile(gitIgnorePath, gitIgnoreContent)
  }

  /**
   * Create a Dockerfile
   */
  private createDockerfile (): void {
    const filePath = path.join(this.PROJECT_DIR, 'Dockerfile')
    const fileContent = FileTemplateManager.getTemplate('Dockerfile')
    this.writeFile(filePath, fileContent)
  }

  /**
   * Create a vite.config.js file
   */
  private createViteConfig (): void {
    const filePath = path.join(this.PROJECT_DIR, 'vite.config.js')
    const fileContent = FileTemplateManager.getTemplate('vite.config.js')
    this.writeFile(filePath, fileContent)
  }

  /**
   * Create a src/server/app.js file
   */
  private createServerApp (): void {
    const filePath = path.join(this.PROJECT_DIR, 'src/server', 'app.js')
    const fileContent = FileTemplateManager.getTemplate('src/server/app.js')
    this.writeFile(filePath, fileContent)
  }

  /**
   * Create a src/__generated__/schema.json file
   */
  private createSchema(): void {
    const appSchema: AppSchema = {
      version: 0,
      pages: [],
    };
    const filePath = path.join(this.PROJECT_DIR, 'src/__generated__', 'schema.json')
    const fileContent = JSON.stringify(appSchema, null, 2);
    this.writeFile(filePath, fileContent);
  }

  /**
   * Create a src/client/index.jsx file
   */
  private createClientIndex (): void {
    const filePath = path.join(this.PROJECT_DIR, 'src/client', 'index.jsx')
    const fileContent = FileTemplateManager.getTemplate('src/client/index.jsx');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Create a src/server/main.js file
   */
  private createServerMain (): void {
    const filePath = path.join(this.PROJECT_DIR, 'src/server', 'main.js')
    const fileContent = FileTemplateManager.getTemplate('src/server/main.js');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Create a directory
   */
  private createDir (dirName?: string): void {
    // Skip if directory already exists
    if (dirName && fs.existsSync(path.join(this.PROJECT_DIR, dirName))) {
      return;
    }
    
    try {
      if (!dirName) {
        fs.mkdirSync(this.PROJECT_DIR, { recursive: true })
      } else {
        const dirPath = path.join(this.PROJECT_DIR, dirName)
        fs.mkdirSync(dirPath, { recursive: true })
      }
    } catch (error) {
      console.error(`Error creating ${dirName} directory:`, error)
    }
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
