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
    this.createDir('app')
    this.createDir('app/routes')
    this.createDir('app/.server')
    this.createDir('app/.server/data-sources')
    this.createDir('app/.server/trpc-routers')

    // Create root files
    this.createPackageJson({ 
      name: options.projectName,
      dependencies: {},
      devDependencies: this.usingTsc ? this.getTypescriptDependencies() : {}
    })
    this.createGitIgnore()
    if (this.usingTsc) {
      this.createFileFromTemplate('tsconfig.json', path.join(this.projectDir, 'tsconfig.json'));
    };

    // Create files
    this.createFileFromTemplate('tsconfig.json', path.join(this.projectDir, 'tsconfig.json'));
    this.createFileFromTemplate('vite.config.ts', path.join(this.projectDir, 'vite.config.ts'));
    this.createFileFromTemplate('app/root.jsx', path.join(this.projectDir, `app/root.${this.jsxExt}`));
    this.createFileFromTemplate('app/trpc.client.js', path.join(this.projectDir, `app/trpc.client.${this.jsExt}`));
    this.createFileFromTemplate('app/entry.client.jsx', path.join(this.projectDir, `app/entry.client.${this.jsxExt}`));
    this.createFileFromTemplate('app/service-route.js', path.join(this.projectDir, `app/service-route.${this.jsExt}`));
    this.createFileFromTemplate('app/.server/trpc.js', path.join(this.projectDir, `app/.server/trpc.${this.jsExt}`));
    this.createFileFromTemplate(
      'app/.server/app.js', 
      path.join(this.projectDir, `app/.server/app.${this.jsExt}`),
      {
        appId: options.appId,
        secretKey: options.secretKey,
      }
    );
    this.createFileFromTemplate('app/.server/data-sources/registry.js', path.join(this.projectDir, `app/.server/data-sources/registry.${this.jsExt}`));
    this.createFileFromTemplate('app/.server/trpc-routers/app-router.js', path.join(this.projectDir, `app/.server/trpc-routers/app-router.${this.jsExt}`));
    this.createFileFromTemplate('app/.server/trpc-routers/page-routers.generated.js', path.join(this.projectDir, `app/.server/trpc-routers/page-routers.generated.${this.jsExt}`));
    
    // Create auto-generated files
    this.createSchema()
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
      '@types/react-dom': "^18.x",
    };
  }

  /**
   * Add a data source to the project.
   * @param dataSourceType The type of the data source.
   * @returns The path to the data source file.
   */
  public addDataSource (dataSourceType: DataSourceType): string {
    const dataSourceTypeData = dataSourcesTypeData[dataSourceType];
    const { fileTemplateName } = dataSourceTypeData;

    // Create directory
    this.createDir(`app/.server/data-sources/${dataSourceType}`)

    // Create file
    const filePath = path.join(this.projectDir, `app/.server/data-sources/${dataSourceType}`, `index.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate(fileTemplateName);
    this.writeFile(filePath, fileContent)

    // Update app/.server/data-sources/registry.ts
    const registryFilePath = path.join(this.projectDir, 'app/.server/data-sources', `registry.${this.jsExt}`)
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

    return filePath;
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
    } = process.env;

    const packageJson = {
      name: options.name,
      version: options.version || '1.0.0',
      type: 'module',
      private: true,
      sideEffects: false,
      scripts: {
        'dev': 'kottster dev --port 5480',
        'dev:add-data-source': 'kottster add-data-source',
        'build': 'remix vite:build',
        'start': 'remix-serve ./build/server/index.js',
        'typecheck': 'tsc'
      },
      dependencies: {
        'react': '^18.x',
        'react-dom': '^18.x',

        '@remix-run/node': "^2.x",
        '@remix-run/react': "^2.x",
        '@remix-run/serve': "^2.x",

        '@kottster/common': KOTTSTER_COMMON_DEP_VER ?? '^1.x',
        '@kottster/cli': KOTTSTER_CLI_DEP_VER ?? '^2.x',
        '@kottster/server': KOTTSTER_SERVER_DEP_VER ?? '^1.x',
        '@kottster/react': KOTTSTER_REACT_DEP_VER ?? '^1.x',

        '@mantine/charts': '^7.x',
        '@mantine/core': '^7.x',
        '@mantine/dates': '^7.x',
        '@mantine/form': '^7.x',
        '@mantine/hooks': '^7.x',
        '@mantine/modals': '^7.x',
        '@mantine/notifications': '^7.x',
        'react-feather': '^2.x',
        'recharts': '^2.x',

        '@trpc/client': '^10.x',
        '@trpc/react-query': '^10.x',
        '@trpc/server': '^10.x',
        
        '@tanstack/react-query': '^4.x',
        'zod': '^3.x',
        'isbot': '^4.x',
        "dayjs": "^1.x",

        ...(options.dependencies ?? {}),
      },
      devDependencies: {
        '@remix-run/dev': "^2.x",
        'vite': "^5.x",
        'vite-tsconfig-paths': "^4.x",
        'esbuild': '0.23.1',
        "@originjs/vite-plugin-commonjs": "^1.x",
        ...(options.devDependencies ?? {}),
      },
      engines: {
        node: '>=20',
      },
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
   * Create a file from a template
   * @param templateKey The key of the template
   * @param filePath The file path
   * @param vars The variables to replace in the template
   */
  private createFileFromTemplate (templateKey: keyof typeof FileTemplateManager.templates, filePath: string, vars: Record<string, string> = {}): void {
    const fileContent = this.fileTemplateManager.getTemplate(templateKey, vars);
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
   * Create a app-schema.json file
   */
  private createSchema(): void {
    const appSchema: AppSchema = {
      navItems: [],
    };
    const filePath = path.join(this.projectDir, 'app-schema.json')
    const fileContent = JSON.stringify(appSchema, null, 2);
    this.writeFile(filePath, fileContent);
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
