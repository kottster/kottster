import path from 'path'
import fs from 'fs'
import { dataSourcesTypeData, DataSourceType } from '@kottster/common'
import { FileTemplateManager } from './fileTemplateManager.service'
import { VERSION } from '../version'

interface FileCreatorOptions {
  projectDir?: string
  usingTsc?: boolean
}

interface CreateProjectOptions {
  projectName: string;
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
    this.createDir('app/pages')
    this.createDir('app/_server')
    this.createDir('app/_server/data-sources')

    // Create root files
    this.createPackageJson({ 
      name: options.projectName,
      dependencies: {},
      devDependencies: this.usingTsc ? this.getTypescriptDependencies() : {}
    })
    this.createGitIgnore()
    
    // Create files
    this.createFileFromTemplate('vite.config.js', path.join(this.projectDir, `vite.config.${this.jsExt}`));
    this.createFileFromTemplate('Dockerfile', path.join(this.projectDir, 'Dockerfile'));
    this.createFileFromTemplate('docker-compose.yml', path.join(this.projectDir, 'docker-compose.yml'));
    this.createFileFromTemplate('app/index.html', path.join(this.projectDir, `app/index.html`));
    this.createFileFromTemplate('app/main.jsx', path.join(this.projectDir, `app/main.${this.jsxExt}`));
    this.createFileFromTemplate('app/_server/app.js', path.join(this.projectDir, `app/_server/app.${this.jsExt}`));
    this.createFileFromTemplate('app/_server/server.js', path.join(this.projectDir, `app/_server/server.${this.jsExt}`));
    if (this.usingTsc) {
      this.createFileFromTemplate('tsconfig.json', path.join(this.projectDir, 'tsconfig.json'));
    }
    
    this.createSchema()
  }

  /**
   * Get the additional dependencies for a TypeScript project.
   * @returns The TypeScript dependencies.
   */
  private getTypescriptDependencies(): Record<string, string> {
    return {
      'typescript': '^5.x',
      '@types/node': '^20.x',
      '@types/react': '^19.x',
      '@types/react-dom': "^19.x",
    };
  }

  /**
   * Add a data source to the project.
   * @param dataSourceType The type of the data source.
   * @returns The path to the data source file.
   */
  public addDataSource (dataSourceType: DataSourceType, dataSourceName?: string, data: Record<string, unknown> = {}): string {
    const dataSourceTypeData = dataSourcesTypeData[dataSourceType];
    const { fileTemplateName } = dataSourceTypeData;

    const finalDataSourceName = dataSourceName || `${dataSourceType}-db`;
    const directory = `app/_server/data-sources/${finalDataSourceName}`;

    // Create directory
    this.createDir(directory);

    // Create file with adapter
    const filePath = path.join(directory, `index.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate(fileTemplateName as keyof typeof FileTemplateManager.templates, data);
    this.writeFile(filePath, fileContent)

    // Create dataSource.json file
    const dataSourceJsonPath = path.join(directory, 'dataSource.json');
    const dataSourceJsonContent = JSON.stringify({
      type: dataSourceType,
      tablesConfig: {},
    }, null, 2);
    this.writeFile(dataSourceJsonPath, dataSourceJsonContent);

    return filePath;
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
        'dev': 'kottster dev',
        'dev:add-data-source': 'kottster add-data-source',
        "build": "vite build && kottster build:server",
        "start": "node dist/server/server.cjs"
      },
      dependencies: {
        'react': '^19.x',
        'react-dom': '^19.x',
        'react-router-dom': '^7.x',
        'better-sqlite3': '^12.x',

        // Using exact same version as the CLI.
        // This ensures compatibility between the core packages
        '@kottster/common': KOTTSTER_COMMON_DEP_VER ?? VERSION,
        '@kottster/cli': KOTTSTER_CLI_DEP_VER ?? VERSION,
        '@kottster/server': KOTTSTER_SERVER_DEP_VER ?? VERSION,
        '@kottster/react': KOTTSTER_REACT_DEP_VER ?? VERSION,

        ...(options.dependencies ?? {}),
      },
      devDependencies: {
        'vite': "^6.x",
        'vite-tsconfig-paths': "^4.x",
        "@vitejs/plugin-react": "^4.x",
        
        // Using tsx to run TS/JS files directly
        'tsx': '^4.x',
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
    const gitIgnoreContent = ['node_modules', 'nbuild', 'npm-debug.log', '.DS_Store', '.cache'].join('\n')

    this.writeFile(gitIgnorePath, gitIgnoreContent)
  }

  /**
   * Create a file from a template
   * @param templateKey The key of the template
   * @param filePath The file path
   * @param vars The variables to replace in the template
   */
  private createFileFromTemplate (templateKey: keyof typeof FileTemplateManager.templates, filePath: string): void {
    const fileContent = this.fileTemplateManager.getTemplate(templateKey, {});
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
   * Create a kottster-app.json file
   */
  private createSchema(): void {
    const appSchema = {};
    const filePath = path.join(this.projectDir, 'kottster-app.json')
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
