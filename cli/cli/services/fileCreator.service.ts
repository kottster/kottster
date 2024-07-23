import path from 'path'
import fs from 'fs'
import { AppSchema, DataSourceType } from '@kottster/common'
import { FileTemplateManager } from './fileTemplateManager.service'
import { DataSourceClientManager } from './dataSourceClientManager.service'

interface CreateProjectOptions {
  projectName: string
  appId: string
  secretKey: string
  database: string
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
    private readonly APP_ID: string,
    private readonly PROJECT_DIR: string
  ) {}

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

    // Create files
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
    const { fileTemplateName, type } = DataSourceClientManager.get(dataSourceType);
    
    // Create directory
    this.createDir(`src/server/data-sources/${type}`)

    // Create file
    const filePath = path.join(this.PROJECT_DIR, `src/server/data-sources/${type}`, `index.js`)
    const fileContent = FileTemplateManager.getTemplate(fileTemplateName);
    this.writeFile(filePath, fileContent)

    // Update src/server/main.js
    const mainFilePath = path.join(this.PROJECT_DIR, 'src/server', 'main.js')
    let mainFileContent = fs.readFileSync(mainFilePath, 'utf8')
    mainFileContent = this.addImportsToFile(mainFileContent, [
      `${type}DataSource from './data-sources/${type}'`
    ]);
    mainFileContent = this.addCodeBeforeAppStart(mainFileContent, `app.registerDataSources([\n  ${type}DataSource,\n]);`);
    this.writeFile(mainFilePath, mainFileContent)
  }

  /**
   * Add files that exports all the procedures in the src/server/procedures directory
   */
  public addServerProcedures (): void {
    const filenames = fs.readdirSync(path.join(this.PROJECT_DIR, 'src/server/procedures'));
    const procedures = filenames.filter(filename => filename.endsWith('.js')).map(filename => filename.split('.')[0]);

    const procedureImports = procedures.map(procedure => `import ${procedure} from '../../server/procedures/${procedure}.js';`).join('\n');
    const procedureExports = procedures.map(procedure => `${procedure},`).join('\n');
    
    const filePath = path.join(this.PROJECT_DIR, 'src/__generated__/server', 'procedures.generated.js')
    const fileContent = procedureExports ? `${procedureImports} \n\nexport default {\n${procedureExports}\n}` : 'export default {};\n';
    
    this.createDir('src/__generated__/server');
    this.writeFile(filePath, fileContent)
  }

  /**
   * Add files that exports all the procedures in the src/server/procedures directory
   */
  public addClientPages (): void {
    const pages = fs.readdirSync(path.join(this.PROJECT_DIR, 'src/client/pages'));
    const pageImports = pages.map(page => `import ${page} from '../../client/pages/${page}/index.jsx';`).join('\n');
    const pageExports = pages.map(page => `${page},`).join('\n');
    
    const filePath = path.join(this.PROJECT_DIR, 'src/__generated__/client', 'pages.generated.js')
    const fileContent = pageExports ? `${pageImports} \n\nexport default {\n${pageExports}\n}` : 'export default {};\n';

    this.createDir('src/__generated__/client');
    this.writeFile(filePath, fileContent)
  }

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
      '\n\n' + // Add two newlines after the inserted code
      fileContent.slice(insertPosition);
  
    return updatedContent;
  }

  private addImportsToFile(fileContent: string, imports: string[]): string {
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
      '\n' + // Add newline after the new imports
      fileContent.slice(insertPosition);
    
    return updatedContent;
  }

  /**
   * Create a package.json file
   */
  private createPackageJson (options: PackageJsonOptions) {
    const packageJsonPath = path.join(this.PROJECT_DIR, 'package.json')

    const packageJson = {
      name: options.name,
      type: 'module',
      version: options.version || '1.0.0',
      scripts: {
        'start:prod': 'kottster start src/server/main.js --production',
        'start:dev': 'kottster start src/server/main.js',
        'dev:add-data-source': 'kottster add-data-source',
        postinstall: 'npm install @kottster/cli@^1.0.0 -g'
      },
      engines: {
        node: '>=16.0.0'
      },
      dependencies: {
        '@kottster/common': process.env.KOTTSTER_COMMON_DEP_VER ?? '^1.0.0',
        '@kottster/cli': process.env.KOTTSTER_CLI_DEP_VER ?? '^2.0.0',
        '@kottster/server': process.env.KOTTSTER_BACKEND_DEP_VER ?? '^1.0.0',
        '@kottster/react': process.env.KOTTSTER_REACT_DEP_VER ?? '^0.1.0',
        ...(options.dependencies ?? {}),
      },
      devDependencies: (options.devDependencies != null) || {}
    }
    const packageJsonContent = JSON.stringify(packageJson, null, 2)

    this.writeFile(packageJsonPath, packageJsonContent)
  }

  /**
   * Create a .env file
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
