import path from 'path'
import fs from 'fs'
import { dataSourcesTypeData, DataSourceType } from '@kottster/common'
import { FileTemplateManager } from './fileTemplateManager.service'

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
    this.createDir('app/routes')
    this.createDir('app/.server')
    this.createDir('app/.server/data-sources')

    // Create root files
    this.createPackageJson({ 
      name: options.projectName,
      dependencies: {},
      devDependencies: this.usingTsc ? this.getTypescriptDependencies() : {}
    })
    this.createGitIgnore()
    
    // Create files
    this.createFileFromTemplate('tsconfig.json', path.join(this.projectDir, 'tsconfig.json'));
    this.createFileFromTemplate('vite.config.ts', path.join(this.projectDir, 'vite.config.ts'));
    this.createFileFromTemplate('postcss.config.js', path.join(this.projectDir, 'postcss.config.js'));
    this.createFileFromTemplate('tailwind.config.ts', path.join(this.projectDir, 'tailwind.config.ts'));
    this.createFileFromTemplate('app/root.jsx', path.join(this.projectDir, `app/root.${this.jsxExt}`));
    this.createFileFromTemplate('app/entry.client.jsx', path.join(this.projectDir, `app/entry.client.${this.jsxExt}`));
    this.createFileFromTemplate('app/service-route.js', path.join(this.projectDir, `app/service-route.${this.jsExt}`));
    this.createFileFromTemplate('app/.server/app.js', path.join(this.projectDir, `app/.server/app.${this.jsExt}`));
    this.createFileFromTemplate('app/.server/data-sources/registry.js', path.join(this.projectDir, `app/.server/data-sources/registry.${this.jsExt}`));
    
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
  public addDataSource (dataSourceType: DataSourceType, data: Record<string, unknown> = {}): string {
    const dataSourceTypeData = dataSourcesTypeData[dataSourceType];
    const { fileTemplateName } = dataSourceTypeData;

    // Create directory
    this.createDir(`app/.server/data-sources/${dataSourceType}`)

    // Create file
    const filePath = path.join(this.projectDir, `app/.server/data-sources/${dataSourceType}`, `index.${this.jsExt}`)
    const fileContent = this.fileTemplateManager.getTemplate(fileTemplateName as keyof typeof FileTemplateManager.templates, data);
    this.writeFile(filePath, fileContent)

    // Update app/.server/data-sources/registry.ts
    const registryFilePath = path.join(this.projectDir, 'app/.server/data-sources', `registry.${this.jsExt}`)
    const registryFileContent = this.fileTemplateManager.getTemplate('app/.server/data-sources/registry.js', { dataSourceName: dataSourceType });
    this.writeFile(registryFilePath, registryFileContent);

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
        'dev': 'kottster dev --port 5480',
        'dev:add-data-source': 'kottster add-data-source',
        'build': 'remix vite:build',
        'start': 'remix-serve ./build/server/index.js'
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
        
        'isbot': '^4.x',
        
        ...(options.dependencies ?? {}),
      },
      devDependencies: {
        '@remix-run/dev': "^2.x",
        'vite': "^5.x",
        'vite-tsconfig-paths': "^4.x",
        'esbuild': '0.23.1',
        'tailwindcss': '^3.x',
        'postcss': '^8.x',
        'autoprefixer': '^10.x',
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
   * Create a app-schema.json file
   */
  private createSchema(): void {
    const appSchema = {};
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
