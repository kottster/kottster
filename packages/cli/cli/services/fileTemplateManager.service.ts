import { stripIndent } from "@kottster/common";

type TemplateVars = {
  'vite.config.ts': undefined;
  'tsconfig.json': undefined;
  'app/.server/app.js': undefined;
  'app/.server/data-sources/postgres/index.js': {
    connection?: string | {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
    searchPath?: string;
  };
  'app/.server/data-sources/mysql/index.js': {
    connection?: string | {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
  };
  'app/.server/data-sources/mariadb/index.js': {
    connection?: string | {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
  };
  'app/.server/data-sources/mssql/index.js': undefined;
  'app/.server/data-sources/sqlite/index.js': {
    connection?: {
      filename: string;
    };
  };
  'app/.server/data-sources/registry.js': {
    dataSourceName: string;
  };
  'app/root.jsx': undefined;
  'app/service-route.js': undefined;
  'app/entry.client.jsx': undefined;
};

/**
 * Service for storing file templates
 */
export class FileTemplateManager {
  constructor(
    private readonly usingTsc: boolean
  ) {}

  static templates: {
    [K in keyof TemplateVars]: TemplateVars[K] extends undefined 
      ? string | ((usingTsc: boolean) => string)
      : (usingTsc: boolean, vars: TemplateVars[K]) => string;
  } = {
    'vite.config.ts': (usingTsc) => stripIndent(`
      import { defineConfig } from 'vite';
      import { vitePlugin as remix } from '@remix-run/dev';
      import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
      import tsconfigPaths from 'vite-tsconfig-paths';

      export default defineConfig({
        plugins: [
          remix({
            future: {
              v3_fetcherPersist: true,
              v3_relativeSplatPath: true,
              v3_throwAbortReason: true,
              v3_lazyRouteDiscovery: false,
              v3_singleFetch: false,
            },
            routes(defineRoutes) {
              return defineRoutes((route) => {
                route('/auth/*', 'service-route.${usingTsc ? 'ts' : 'js'}', { id: 'auth' }),
                route('/-/*', 'service-route.${usingTsc ? 'ts' : 'js'}', { id: 'service' })
              });
            },
          }),
          tsconfigPaths(),
          viteCommonjs({
            include: ['util'],
          }),
        ],
        optimizeDeps: {
          include: ['react', 'react-dom', '@kottster/common', '@kottster/server'],
          exclude: ['@kottster/react'],
        },
      });
    `),
    
    'tsconfig.json': stripIndent(`
      {
        "include": [
          "**/*.ts",
          "**/*.tsx",
          "**/.server/**/*.ts",
          "**/.server/**/*.tsx",
          "**/.client/**/*.ts",
          "**/.client/**/*.tsx"
        ],
        "compilerOptions": {
          "lib": ["DOM", "DOM.Iterable", "ES2022"],
          "types": ["@remix-run/node", "vite/client"],
          "isolatedModules": true,
          "esModuleInterop": true,
          "jsx": "react-jsx",
          "module": "ESNext",
          "moduleResolution": "Bundler",
          "resolveJsonModule": true,
          "target": "ES2022",
          "strict": true,
          "allowJs": true,
          "skipLibCheck": true,
          "forceConsistentCasingInFileNames": true,
          "baseUrl": ".",
          "paths": {
            "@/*": ["./app/*"]
          },
          "noEmit": true
        }
      }
    `),

    'app/.server/app.js': stripIndent(`
      import { createApp } from '@kottster/server';
      import { dataSourceRegistry } from './data-sources/registry';
      import schema from '../../app-schema.json';

      export const app = createApp({
        schema,
        secretKey: process.env.SECRET_KEY,

        // For security, consider moving the secret key to an environment variable:
        // secretKey: process.env.NODE_ENV === 'development' ? 'dev-secret-key' : process.env.SECRET_KEY,
      });

      app.registerDataSources(dataSourceRegistry);
    `),

    'app/.server/data-sources/postgres/index.js': (usingTsc, vars) => stripIndent(`
      import { createDataSource, KnexPgAdapter } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.postgres` : `'postgres'`},
        name: 'postgres',
        init: () => {
          /**${!vars.connection ? ` \n           * Replace the following with your connection options. ` : ''}
           * Learn more at https://knexjs.org/guide/#configuration-options
           */
          const client = knex({
            client: 'pg',
            connection: ${typeof vars.connection !== 'object' ? `'${vars.connection || 'postgresql://myuser:mypassword@localhost:5432/mydatabase'}',` : `{
              host: '${vars.connection.host || ''}',
              port: ${vars.connection.port ? Number(vars.connection.port) : '5432'},
              user: '${vars.connection.user || ''}',
              password: '${vars.connection.password || ''}',
              database: '${vars.connection.database || ''}',
            },`}
            searchPath: ['${vars.searchPath || 'public'}'],
          });

          return new KnexPgAdapter(client);
        },
        tablesConfig: {}
      });

      export default dataSource;
    `),

    'app/.server/data-sources/mysql/index.js': (usingTsc, vars) => stripIndent(`
      import { createDataSource, KnexMysql2Adapter } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.mysql` : `'mysql'`},
        name: 'mysql',
        init: () => {
          /**${!vars.connection ? ` \n           * Replace the following with your connection options. ` : ''}
           * Learn more at https://knexjs.org/guide/#configuration-options
           */
          const client = knex({
            client: 'mysql2',
            connection: ${typeof vars.connection === 'string' ? `'${vars.connection}',` : `{
              host: '${vars.connection?.host || 'localhost'}',
              port: ${vars.connection?.port ? Number(vars.connection.port) : '3306'},
              user: '${vars.connection?.user || 'myuser'}',
              password: '${vars.connection?.password || 'mypassword'}',
              database: '${vars.connection?.database || 'mydatabase'}',
            },`}
          });

          return new KnexMysql2Adapter(client);
        },
        tablesConfig: {}
      });

      export default dataSource;
    `),

    'app/.server/data-sources/mariadb/index.js': (usingTsc, vars) => stripIndent(`
      import { createDataSource, KnexMysql2Adapter } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.mariadb` : `'mariadb'`},
        name: 'mariadb',
        init: () => {
          /**${!vars.connection ? ` \n           * Replace the following with your connection options. ` : ''}
           * Learn more at https://knexjs.org/guide/#configuration-options
           */
          const client = knex({
            client: 'mysql2',
            connection: ${typeof vars.connection === 'string' ? `'${vars.connection}',` : `{
              host: '${vars.connection?.host || 'localhost'}',
              port: ${vars.connection?.port ? Number(vars.connection.port) : '3307'},
              user: '${vars.connection?.user || 'myuser'}',
              password: '${vars.connection?.password || 'mypassword'}',
              database: '${vars.connection?.database || 'mydatabase'}',
            },`}
          });

          return new KnexMysql2Adapter(client);
        },
        tablesConfig: {}
      });

      export default dataSource;
    `),

    'app/.server/data-sources/mssql/index.js': (usingTsc) => stripIndent(`
      import { createDataSource, KnexTediousAdapter } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.mssql` : `'mssql'`},
        name: 'knex',
        databaseSchemas: ['dbo'],
        init: () => {
          const client = knex({
            /**
             * Read more at https://knexjs.org/guide/#configuration-options
             */
            client: 'mssql',
            connection: {
              server: 'localhost',
              port: 1433,
              user: 'your_database_user',
              password: 'your_database_password',
              database: 'your_database',
            },
          });

          return new KnexTediousAdapter(client);
        },
        tablesConfig: {}
      });

      export default dataSource;
    `),

    'app/.server/data-sources/sqlite/index.js': (usingTsc, vars) => stripIndent(`
      import { createDataSource, KnexBetterSqlite3Adapter } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.sqlite` : `'sqlite'`},
        name: 'sqlite',
        init: () => {
          /**${!vars.connection ? ` \n           * Replace the following with your connection options. ` : ''}
           * Learn more at https://knexjs.org/guide/#configuration-options
           */
          const client = knex({
            client: 'better-sqlite3',
            connection: {
              filename: '${vars.connection?.filename || '/path/to/database.sqlite'}',
            }
          });

          return new KnexBetterSqlite3Adapter(client);
        },
        tablesConfig: {}
      });

      export default dataSource;
    `),

    'app/.server/data-sources/registry.js': (_, vars) => stripIndent(`
      import { DataSourceRegistry } from '@kottster/server';
      ${vars.dataSourceName ? `import ${vars.dataSourceName}DataSource from './${vars.dataSourceName}';` : ''}

      export const dataSourceRegistry = new DataSourceRegistry([${vars.dataSourceName ? `${vars.dataSourceName}DataSource` : ''}]);
    `),

    'app/root.jsx': stripIndent(`
      import { Outlet } from '@remix-run/react';
      import { KottsterApp, ClientOnly, getRootLayout } from '@kottster/react';
      import '@kottster/react/dist/style.css';
      import schema from '../app-schema.json';

      function ClientApp() {
        return (
          <KottsterApp.Provider schema={schema}>
            <Outlet />
          </KottsterApp.Provider>
        );
      }

      export default function App() {
        return (
          <ClientOnly>
            <ClientApp />
          </ClientOnly>
        );
      }

      export const Layout = getRootLayout({ schema });
      export { App as ErrorBoundary };
    `),

    'app/service-route.js': (usingTsc) => stripIndent(`
      import { app } from './.server/app';
      import { SpecialRoutePage } from '@kottster/react';
      ${usingTsc ? `import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';` : ''}

      export const loader = async (args${usingTsc ? ': LoaderFunctionArgs' : ''}) => {
        return app.createServiceRouteLoader()(args);
      };

      export const action = async (args${usingTsc ? ': ActionFunctionArgs' : ''}) => {
        return app.createServiceRouteLoader()(args);
      };

      export default SpecialRoutePage;
    `),

    'app/entry.client.jsx': stripIndent(`
      import { startTransition, StrictMode } from 'react';
      import { RemixBrowser } from '@remix-run/react';
      import { hydrateRoot } from 'react-dom/client';
      import { handleRecoverableError } from '@kottster/react';

      startTransition(() => {
        hydrateRoot(
          document,
          <StrictMode>
            <RemixBrowser />
          </StrictMode>,
          {
            onRecoverableError: handleRecoverableError
          }
        );
      });
    `),
    
  };

  /**
   * Get a template
   * @param name Template name
   * @param vars Variables to replace in the template
   * @returns The file content
   */
  public getTemplate<T extends keyof TemplateVars>(
    name: T,
    vars: TemplateVars[T] = {} as TemplateVars[T]
  ): string {
    const template = FileTemplateManager.templates[name];
    if (!template) {
      throw new Error(`Template ${name} not found`);
    }
    
    if (typeof template === 'function') {
      return template(this.usingTsc, vars as TemplateVars[T]);
    }

    return template;
  }
}
