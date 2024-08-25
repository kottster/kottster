import path from 'path'
import fs from 'fs'
import { AppSchema, AutoImport, DataSourceType } from '@kottster/common'
import { FileTemplateManager } from './fileTemplateManager.service'
import dataSourcesTypeData from '../constants/dataSourceTypeData'

interface FileCreatorOptions {
  projectDir?: string
  usingTsc?: boolean
}

interface CreateProjectOptions {
  projectName: string
  appId: string
  secretKey: string
}

interface PackageJsonOptions {
  name: string
  type?: 'module'
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
  private readonly projectDir: string;
  private readonly usingTsc: boolean;
  private readonly fileTemplateManager: FileTemplateManager;

  constructor (options?: FileCreatorOptions) {
    this.projectDir = options?.projectDir ?? process.cwd();
    this.usingTsc = options?.usingTsc ?? false;
    this.fileTemplateManager = new FileTemplateManager(this.usingTsc);
  }

  get jsExt () {
    return this.usingTsc ? 'ts' : 'js';
  }
  
  get jsxExt () {
    return this.usingTsc ? 'tsx' : 'jsx';
  }

  /**
   * Create a new project files.
   * @param options The new project options.
   */
  public createProject (options: CreateProjectOptions): void {
    const autoImport = new AutoImport({
      projectDir: this.projectDir,
      usingTsc: this.usingTsc,
    });

    // Check if project directory already exists
    if (fs.existsSync(this.projectDir) && options.projectName !== '.') {
      throw new Error(`Project directory already exists: ${this.projectDir}`)
    };

    // Create directories
    this.createDir()
    this.createDir('src')
    this.createDir('src/client')
    this.createDir('src/client/pages')
    this.createDir('src/__generated__/client')
    this.createDir('src/__generated__/server')
    this.createDir('src/server')
    this.createDir('src/server/procedures')
    this.createDir('src/server/data-sources')

    // Create root files
    this.createPackageJson({ 
      name: options.projectName,
      dependencies: {},
      devDependencies: this.usingTsc ? this.getTypescriptDependencies() : {}
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
    this.createViteConfig()
    if (this.usingTsc) {
      this.createTsConfig()
    };

    // Create files
    this.createClientIndexHtml()
    this.createClientMain()
    this.createClientTRPC()
    this.createServerMain()
    this.createServerTRPC()
    this.createDataSourceRegistry()
    this.createGeneratedServerTRPCRouter()
    if (this.usingTsc) {
      this.createGeneratedClientTRPCRouter()
    }
    
    // Create auto-generated files
    this.createSchema()
    autoImport.createServerProceduresFile()
    autoImport.createClientPagesFile()
  }

  /**
   * Get the additional dependencies for a TypeScript project.
   * @returns The TypeScript dependencies.
   */
  private getTypescriptDependencies(): Record<string, string> {
    return {
      'typescript': '^5.x',
      '@types/node': '^18.x',
      '@types/react': '^18.x',
      'ts-node': '^10.x',
    };
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
    const filePath = path.join(this.projectDir, `src/server/data-sources/${dataSourceType}`, `index.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate(fileTemplateName);
    this.writeFile(filePath, fileContent)

    // Update src/server/data-sources/registry.ts
    const registryFilePath = path.join(this.projectDir, 'src/server/data-sources', `registry.${this.jsExt}`)
    const registryFileContent = fs.readFileSync(registryFilePath, 'utf8');
    const updatedRegistryFileContent = this.updateDataSourceRegistryFileContent(
      registryFileContent, 
      [
        `${dataSourceType}DataSource from './${dataSourceType}'`,
        `{ Knex } from 'knex'`,
      ],
      `${dataSourceType}DataSource`,
      [
        ['knex', 'Knex']
      ],
    );
    this.writeFile(registryFilePath, updatedRegistryFileContent);
  }

  private updateDataSourceRegistryFileContent(
    fileContent: string,
    imports: string[],
    newDataSourceName: string,
    newDataSourceContextToClientItem: [string, string][]
  ): string {
    // Add new imports
    const importRegex = /import.*?from.*?;/g;
    const existingImports = [...fileContent.matchAll(importRegex)].map(match => match[0]);
    const lastImportMatch = existingImports.pop();
    
    if (lastImportMatch) {
      const insertPosition = fileContent.indexOf(lastImportMatch) + lastImportMatch.length;
      const newImports = imports
        .filter(imp => !existingImports.some(existing => existing.includes(imp)))
        .map(imp => `import ${imp};`)
        .join('\n');
      
      if (newImports) {
        fileContent = fileContent.slice(0, insertPosition) + '\n' + newImports + fileContent.slice(insertPosition);
      }
    }
  
    // dataSourceRegistry
    const dataSourceRegistryRegex = /export const dataSourceRegistry = new DataSourceRegistry\(\[([^\]]*)\]\);/;
    const dataSourceRegistryMatch = fileContent.match(dataSourceRegistryRegex);
    if (dataSourceRegistryMatch) {
      const existingDataSources = dataSourceRegistryMatch[1].trim();
      const updatedDataSources = existingDataSources
        ? `${existingDataSources},\n  ${newDataSourceName}`
        : `\n  ${newDataSourceName}\n`;
      fileContent = fileContent.replace(dataSourceRegistryRegex, `export const dataSourceRegistry = new DataSourceRegistry([${updatedDataSources}]);`);
    }
  
    // DataSourceContextToClientMap
    const dataSourceContextMapRegex = /export type DataSourceContextToClientMap = {([^}]*)};/;
    const dataSourceContextMapMatch = fileContent.match(dataSourceContextMapRegex);
    if (dataSourceContextMapMatch) {
      const existingItems = dataSourceContextMapMatch[1].trim();
      const newItems = newDataSourceContextToClientItem
        .map(([key, value]) => `  ${key}: ${value}`)
        .join(',\n');
      const updatedItems = existingItems
        ? `${existingItems},\n${newItems}`
        : `\n${newItems}\n`;
      fileContent = fileContent.replace(dataSourceContextMapRegex, `export type DataSourceContextToClientMap = {${updatedItems}};`);
    }
  
    return fileContent;
  }

  /**
   * Create a package.json file
   * @param options The package.json content
   */
  private createPackageJson (options: PackageJsonOptions) {
    const packageJsonPath = path.join(this.projectDir, 'package.json')

    const packageJson = {
      name: options.name,
      type: this.usingTsc ? undefined : 'module',
      version: options.version || '1.0.0',
      scripts: {
        'build': this.usingTsc ? 'tsc && vite build' : 'vite build',
        'start:prod': `kottster start ${this.usingTsc ? 'dist/server/main.js' : 'src/server/main.js'}`,
        'start:dev': `kottster start ${this.usingTsc ? `src/server/main.ts` : `src/server/main.js`} --development`,
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
        '@kottster/react': process.env.KOTTSTER_REACT_DEP_VER ?? '^1.x',
        '@tanstack/react-query': '^4.x',
        '@trpc/client': '^10.x',
        '@trpc/react-query': '^10.x',
        '@trpc/server': '^10.x',
        'react': '^18.x',
        'react-dom': '^18.x',
        'antd': '^5.x',
        '@ant-design/icons': '^5.x',
        'zod': '^3.23.8',
        'recharts': '^2.x',
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
    const envPath = path.join(this.projectDir, '.env')
    const envContent = options.map(({ key, comment, value }) => {
      return `${comment ? `# ${comment}\n` : ''}${key}=${value}`
    }).join('\n\n') + '\n';

    this.writeFile(envPath, envContent)
  }

  /**
   * Create a .gitignore file
   */
  private createGitIgnore (): void {
    const gitIgnorePath = path.join(this.projectDir, '.gitignore')
    const gitIgnoreContent = ['node_modules', 'nbuild', 'npm-debug.log', '.DS_Store'].join('\n')

    this.writeFile(gitIgnorePath, gitIgnoreContent)
  }

  /**
   * Create a src/server/data-sources/registry.ts file
   */
  private createDataSourceRegistry (): void {
    const filePath = path.join(this.projectDir, 'src/server/data-sources', `registry.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/server/data-sources/registry.js')
    this.writeFile(filePath, fileContent)
  }

  /**
   * Create a vite.config.js file
   */
  private createViteConfig (): void {
    const filePath = path.join(this.projectDir, 'vite.config.js')
    const fileContent = this.fileTemplateManager.getTemplate('vite.config.js')
    this.writeFile(filePath, fileContent)
  }

  /**
   * Create a tsconfig.json file
   */
  private createTsConfig (): void {
    const filePath = path.join(this.projectDir, 'tsconfig.json')
    const fileContent = this.fileTemplateManager.getTemplate('tsconfig.json')
    this.writeFile(filePath, fileContent)
  }

  /**
   * Create a src/server/trpc.js file
   */
  private createServerTRPC (): void {
    const filePath = path.join(this.projectDir, 'src/server', `trpc.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/server/trpc.js')
    this.writeFile(filePath, fileContent)
  }

  /**
   * Create a src/__generated__/server/trpcRouter.ts file
   */
  private createGeneratedServerTRPCRouter (): void {
    const filePath = path.join(this.projectDir, 'src/__generated__/server', `trpcRouter.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/__generated__/server/trpcRouter.js')
    this.writeFile(filePath, fileContent)
  }

  /**
   * Create a src/__generated__/client/trpcRouter.ts file
   */
  private createGeneratedClientTRPCRouter (): void {
    const filePath = path.join(this.projectDir, 'src/__generated__/client', `trpcRouter.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/__generated__/client/trpcRouter.ts')
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
    const filePath = path.join(this.projectDir, 'src/__generated__', 'schema.json')
    const fileContent = JSON.stringify(appSchema, null, 2);
    this.writeFile(filePath, fileContent);
  }

  // /**
  //  * Create a src/__generated__/server/tRPC.generated.js file
  //  */
  // private createServerTRPC(): void {
  //   const filePath = path.join(this.projectDir, 'src/__generated__/server', `tRPC.generated.${this.jsExt}`)
  //   const fileContent = this.fileTemplateManager.getTemplate('src/__generated__/server/tRPC.generated.js');
  //   this.writeFile(filePath, fileContent);
  // }

  /**
   * Create a src/client/main.jsx file
   */
  private createClientMain (): void {
    const filePath = path.join(this.projectDir, 'src/client', `main.${this.jsxExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/client/main.jsx');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Create a src/client/trpc.js file
   */
  private createClientTRPC (): void {
    const filePath = path.join(this.projectDir, 'src/client', `trpc.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/client/trpc.js');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Create a src/client/index.html file
   */
  private createClientIndexHtml (): void {
    const filePath = path.join(this.projectDir, 'src/client', 'index.html')
    const fileContent = this.fileTemplateManager.getTemplate('src/client/index.html');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Create a src/server/main.js file
   */
  private createServerMain (): void {
    const filePath = path.join(this.projectDir, 'src/server', `main.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/server/main.js');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Create a directory
   */
  private createDir (dirName?: string): void {
    // Skip if directory already exists
    if (dirName && fs.existsSync(path.join(this.projectDir, dirName))) {
      return;
    }
    
    try {
      if (!dirName) {
        fs.mkdirSync(this.projectDir, { recursive: true })
      } else {
        const dirPath = path.join(this.projectDir, dirName)
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
