import { stripIndent } from "@kottster/common";

/**
 * Service for storing file templates
 */
export class FileTemplateManager {
  constructor(
    private readonly usingTsc: boolean
  ) {}

  static templates = {
    'vite.config.ts': stripIndent(`
      import { vitePlugin as remix } from '@remix-run/dev';
      import { defineConfig } from 'vite';
      import tsconfigPaths from 'vite-tsconfig-paths';
      import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

      export default defineConfig({
        plugins: [
          remix({
            future: {
              v3_fetcherPersist: true,
              v3_relativeSplatPath: true,
              v3_throwAbortReason: true,
            },
            routes(defineRoutes) {
              return defineRoutes((route) => {
                route('/auth/*', 'service-route.ts', { id: 'auth' }),
                route('/-/*', 'service-route.ts', { id: 'service' })
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

          // Vite takes care of building everything, not tsc.
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

    'app/.server/data-sources/postgres/index.js': (usingTsc: boolean) => stripIndent(`
      import { createDataSource, KnexPgAdapter } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.postgres` : `'postgres'`},
        name: 'postgres',
        databaseSchemas: ['public'],
        init: () => {
          /**
           * Replace the following with your connection options.
           * Read more at https://knexjs.org/guide/#configuration-options
           */
          const client = knex({
            client: 'pg',
            connection: 'postgresql://myuser:mypassword@localhost:5432/mydatabase',
            searchPath: ['public'],
          });

          return new KnexPgAdapter(client);
        }
      });

      export default dataSource;
    `),

    'app/.server/data-sources/mysql/index.js': (usingTsc: boolean) => stripIndent(`
      import { createDataSource, KnexMysql2Adapter } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.mysql` : `'mysql'`},
        name: 'mysql',
        init: () => {
          const client = knex({
            /**
             * Replace the following with your connection options.
             * Read more at https://knexjs.org/guide/#configuration-options
             */
            client: 'mysql2',
            connection: {
              host: '127.0.0.1',
              port: 3306,
              user: 'your_database_user',
              password: 'your_database_password',
              database: 'myapp_test',
            },
          });

          return new KnexMysql2Adapter(client);
        },
      });

      export default dataSource;
    `),

    'app/.server/data-sources/mariadb/index.js': (usingTsc: boolean) => stripIndent(`
      import { createDataSource, KnexMysql2Adapter } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.mariadb` : `'mariadb'`},
        name: 'mariadb',
        init: () => {
          const client = knex({
            /**
             * Replace the following with your connection options.
             * Read more at https://knexjs.org/guide/#configuration-options
             */
            client: 'mysql2',
            connection: {
              host: '127.0.0.1',
              port: 3306,
              user: 'your_database_user',
              password: 'your_database_password',
              database: 'myapp_test',
            },
          });

          return new KnexMysql2Adapter(client);
        },
      });

      export default dataSource;
    `),

    'app/.server/data-sources/mssql/index.js': (usingTsc: boolean) => stripIndent(`
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
             * Replace the following with your connection options.
             * Read more at https://knexjs.org/guide/#configuration-options
             */
            client: 'mssql',
            connection: {
              server: 'localhost',
              port: 1433,
              user: 'your_database_user',
              password: 'your_database_password',
              database: 'myapp_test',
            },
          });

          return new KnexTediousAdapter(client);
        }
      });

      export default dataSource;
    `),

    'app/.server/data-sources/registry.js': stripIndent(`
      import { DataSourceRegistry } from '@kottster/server';

      export const dataSourceRegistry = new DataSourceRegistry([]);
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

    'app/service-route.js': stripIndent(`
      import { app } from '@/.server/app';
      import { SpecialRoutePage } from '@kottster/react';
      import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

      export const loader = async (args: LoaderFunctionArgs) => {
        return app.createServiceRouteLoader()(args);
      };

      export const action = async (args: ActionFunctionArgs) => {
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

    'postcss.config.js': stripIndent(`
      export default {
        plugins: {
          tailwindcss: {},
          autoprefixer: {},
        },
      };
    `),

    'tailwind.config.ts': stripIndent(`
      import type { Config } from "tailwindcss";

      export default {
        content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
        theme: {},
        plugins: [],
      } satisfies Config;
    `),

  };

  /**
   * Get a template
   * @param name Template name
   * @param vars Variables to replace in the template
   * @returns The file content
   */
  public getTemplate(name: keyof typeof FileTemplateManager.templates): string {
    const template = FileTemplateManager.templates[name];
    if (!template) {
      throw new Error(`Template ${name} not found`);
    }
    
    if (typeof template === 'function') {
      return template(this.usingTsc);
    }

    return template;
  };
}
