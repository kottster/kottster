import path from 'path'
import fs from 'fs'
import { AppSchema, DataSourceType } from '@kottster/common'
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
    // Check if project directory already exists
    if (fs.existsSync(this.projectDir) && options.projectName !== '.') {
      throw new Error(`Project directory already exists: ${this.projectDir}`)
    };

    // Create directories
    this.createDir()
    this.createDir('src')
    this.createDir('src/app')
    this.createDir('src/app/utils')
    this.createDir('src/app/pages')
    this.createDir('src/server')
    this.createDir('src/server/data-sources')
    this.createDir('src/server/routers')

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
    if (this.usingTsc) {
      this.createTsConfig()
    };

    // Create files
    this.createNextConfig()
    this.createMiddleware()
    this.createAppRoute()
    this.createAppNotFound()
    this.createAppUtilsTRPC()
    this.createAppLayout()
    this.createServerMain()
    this.createServerTRPC()
    this.createServerRoutersApp()
    this.createDataSourceRegistry()
    
    // Create auto-generated files
    this.createSchema()
    this.createServerGeneratedPageRouters()
  }

  /**
   * Create a next.config.js file.
   */
  private createNextConfig(): void {
    const filePath = path.join(this.projectDir, 'next.config.mjs')
    const fileContent = this.fileTemplateManager.getTemplate('next.config.mjs');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Create an app layout file.
   */
  private createAppLayout(): void {
    const filePath = path.join(this.projectDir, 'src/app', `layout.${this.jsxExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/app/layout.jsx');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Create an app client file.
   */
  private createAppUtilsTRPC(): void {
    const filePath = path.join(this.projectDir, 'src/app/utils', `trpc.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/app/utils/trpc.js');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Create an app not found file.
   */
  private createAppNotFound(): void {
    const filePath = path.join(this.projectDir, 'src/app', `not-found.${this.jsxExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/app/not-found.jsx');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Create a middleware file.
   */
  private createMiddleware(): void {
    const filePath = path.join(this.projectDir, 'src', `middleware.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/middleware.js');
    this.writeFile(filePath, fileContent);
  }

  /**
   * Create an app route file.
   */
  private createAppRoute(): void {
    const filePath = path.join(this.projectDir, 'src/app', `route.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/app/route.js');
    this.writeFile(filePath, fileContent);
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

  /**
   * Update the data source registry file.
   * @param fileContent The file content.
   * @param imports The imports to add.
   * @param newDataSourceName The new data source name.
   * @param newDataSourceContextToClientItem The new data source context to client entry.
   * @returns The updated file content.
   */
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
  
    // Update DataSourceContextToClientMap
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

    const {
      KOTTSTER_COMMON_DEP_VER,
      KOTTSTER_CLI_DEP_VER,
      KOTTSTER_SERVER_DEP_VER,
      KOTTSTER_REACT_DEP_VER,
      KOTTSTER_NEXT_DEP_VER,
    } = process.env;

    const packageJson = {
      name: options.name,
      type: this.usingTsc ? undefined : 'module',
      version: options.version || '1.0.0',
      private: true,
      scripts: {
        'dev': 'kottster dev',
        'dev:add-data-source': 'kottster add-data-source',
        'build': 'next build',
        'start': 'next start',
        'lint': 'next lint'
      },
      dependencies: {
        'next': '^14.x',

        '@kottster/common': KOTTSTER_COMMON_DEP_VER ?? '^1.x',
        '@kottster/cli': KOTTSTER_CLI_DEP_VER ?? '^2.x',
        '@kottster/server': KOTTSTER_SERVER_DEP_VER ?? '^1.x',
        '@kottster/next': KOTTSTER_NEXT_DEP_VER ?? '^1.x',
        '@kottster/react': KOTTSTER_REACT_DEP_VER ?? '^1.x',

        "antd": "^5.x",
        '@ant-design/nextjs-registry': '^1.x',
        '@ant-design/icons': '^5.x',
        'recharts': '^2.x',
        '@tanstack/react-query': '^4.x',
        '@trpc/client': '^10.x',
        '@trpc/react-query': '^10.x',
        '@trpc/server': '^10.x',
        'zod': '^3.x',
        ...(options.dependencies ?? {}),
      },
      devDependencies: {
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
   * Create a src/server/routers/page-routers.generated.ts file
   */
  private createServerGeneratedPageRouters (): void {
    const filePath = path.join(this.projectDir, 'src/server/routers', `page-routers.generated.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/server/routers/page-routers.generated.js')
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
   * Create a src/server/routers/_app.js file
   */
  private createServerRoutersApp (): void {
    const filePath = path.join(this.projectDir, 'src/server/routers', `_app.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate('src/server/routers/_app.js')
    this.writeFile(filePath, fileContent)
  }

  /**
   * Create a schema.json file
   */
  private createSchema(): void {
    const appSchema: AppSchema = {
      navItems: [],
    };
    const filePath = path.join(this.projectDir, 'schema.json')
    const fileContent = JSON.stringify(appSchema, null, 2);
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
