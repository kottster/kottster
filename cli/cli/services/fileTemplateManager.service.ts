import { stripIndent } from "@kottster/common";

type Template = string | ((usingTsc: boolean) => string);

/**
 * Service for storing file templates
 */
export class FileTemplateManager {
  constructor(
    private readonly usingTsc: boolean
  ) {}

  static templates: Record<string, Template> = {
    'tsconfig.json': stripIndent(`
      {
        "compilerOptions": {
          "lib": ["es2023"],
          "module": "commonjs",
          "target": "es2022",
          "moduleResolution": "node",
          "strict": true,
          "esModuleInterop": true,
          "declaration": true,
          "removeComments": true,
          "emitDecoratorMetadata": true,
          "experimentalDecorators": true,
          "allowSyntheticDefaultImports": true,
          "sourceMap": true,
          "outDir": "./dist",
          "rootDir": "./src",
          "incremental": false,
          "skipLibCheck": true,
          "strictNullChecks": false,
          "noImplicitAny": false,
          "strictBindCallApply": false,
          "forceConsistentCasingInFileNames": false,
          "noFallthroughCasesInSwitch": false
        },
        "include": ["src/server/**/*"],
        "exclude": ["node_modules", "**/*.spec.ts", "src/client"]
      }
    `),

    'src/server/trpc.js': usingTsc => stripIndent(`
      import { initTRPC } from '@trpc/server';
      ${usingTsc ? "import { AppContext } from '@kottster/common';\n" : ""}
      ${usingTsc ? "import { DataSourceContextToClientMap } from './data-sources/registry';\n" : ""}
      export const t = initTRPC.context${usingTsc ? '<AppContext & DataSourceContextToClientMap>' : ''}().create();
    `),

    'src/server/main.js': () => stripIndent(`
      import { getEnvOrThrow } from '@kottster/common';
      import { createApp } from '@kottster/server';
      import { tRPCRouter } from '../__generated__/server/trpcRouter';
      import { dataSourceRegistry } from './data-sources/registry';
      
      export const app = createApp({
        appId: getEnvOrThrow('APP_ID'),
        secretKey: getEnvOrThrow('SECRET_KEY'),
      });

      app.setTRPCRouter(tRPCRouter);

      app.registerDataSources(dataSourceRegistry);

      app.start(getEnvOrThrow('PORT') ?? 5480);
    `),

    'src/__generated__/server/trpcRouter.js': stripIndent(`
      import { t } from '../../server/trpc';
      import procedures from './procedures.generated';

      export const tRPCRouter = t.router(procedures);
    `),

    'src/server/data-sources/postgres/index.js': usingTsc => stripIndent(`
      import { createDataSource, KnexPgAdapter } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.postgres` : `'postgres'`},
        contextPropName: 'knex',
        databaseSchemas: ['public'],
        init: () => {
          // Replace the following with your connection options
          // Read more at https://knexjs.org/guide/#configuration-options
          const client = knex({
            client: 'pg',
            connection: 'postgres://user:password@localhost:5432/database',
            searchPath: ['public'],
          });

          return new KnexPgAdapter(client);
        }
      });

      export default dataSource;
    `),

    'src/server/data-sources/mysql/index.js': usingTsc => stripIndent(`
      import { createDataSource, KnexMysql2Adapter } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.mysql` : `'mysql'`},
        contextPropName: 'knex',
        databaseSchemas: ['public'],
        init: () => {
          const client = knex({
            // Replace the following with your connection options
            // Read more at https://knexjs.org/guide/#configuration-options
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

    'src/server/data-sources/mariadb/index.js': usingTsc => stripIndent(`
      import { createDataSource, KnexMysql2Adapter } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.mariadb` : `'mariadb'`},
        contextPropName: 'knex',
        databaseSchemas: ['public'],
        init: () => {
          const client = knex({
            // Replace the following with your connection options
            // Read more at https://knexjs.org/guide/#configuration-options
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

    'src/server/data-sources/mssql/index.js': usingTsc => stripIndent(`
      import { createDataSource, KnexTediousAdapter } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.mssql` : `'mssql'`},
        contextPropName: 'knex',
        databaseSchemas: ['dbo'],
        init: () => {
          const client = knex({
            // Replace the following with your connection options
            // Read more at https://knexjs.org/guide/#configuration-options
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

    'src/client/trpc.js': usingTsc => stripIndent(`
      import { createTRPCClient } from '@kottster/react';
      import { createTRPCReact } from '@trpc/react-query';
      ${usingTsc ? "import { type Router } from '../__generated__/client/trpcRouter';\n" : ""}
      ${usingTsc ? "export const trpc = createTRPCReact<Router>();" : "export const trpc = createTRPCReact();"}
      export const trpcClient = createTRPCClient(trpc);
    `),

    'src/client/main.jsx': stripIndent(`
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      import { ConfigProvider } from 'antd';
      import { App, appTheme } from '@kottster/react';
      import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
      import { trpc, trpcClient } from './trpc';
      import pages from '../__generated__/client/pages.generated';
      import '@kottster/react/dist/style.css';

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            cacheTime: 0,
            staleTime: 0,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: 'always',
          },
        },
      });

      ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <ConfigProvider theme={appTheme}>
                <App pages={pages} />
              </ConfigProvider>
            </QueryClientProvider>
          </trpc.Provider>
        </React.StrictMode>
      );
    `),

    'src/client/index.html': usingTsc => stripIndent(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/${usingTsc ? 'main.tsx' : 'main.jsx'}"></script>
        </body>
      </html>
    `),

    'src/__generated__/client/trpcRouter.ts': stripIndent(`
      import { tRPCRouter } from '../server/trpcRouter';

      export type Router = typeof tRPCRouter;
    `),

    'vite.config.js': stripIndent(`
      import { defineConfig } from 'vite'
      import react from '@vitejs/plugin-react'
      import path from 'path'

      export default defineConfig({
        plugins: [react()],
        root: path.resolve(__dirname, 'src/client'),
        base: '/static/',
        server: {
          hmr: {
            overlay: false
          },
          watch: {
            usePolling: true,
            include: ['src/client/**'],
          },
        },
        build: {
          outDir: '../../dist/static',
          emptyOutDir: false,
        }
      });
    `),

    'src/__generated__/server/tRPC.generated.js': stripIndent(`
      import { initTRPC } from '@trpc/server';
      import { AppContext } from '@kottster/common';

      export const t = initTRPC.context<AppContext>().create();

      export const router = t.router;
    `),

    'src/server/data-sources/registry.js': usingTsc => stripIndent(`
      import { DataSourceRegistry } from '@kottster/server';

      export const dataSourceRegistry = new DataSourceRegistry([]);

      ${usingTsc ? `export type DataSourceContextToClientMap = {};` : ''}
    `)

  };

  /**
   * Get a template
   * @param name Template name
   * @returns The file content
   */
  public getTemplate(name: keyof typeof FileTemplateManager.templates): string {
    const template = FileTemplateManager.templates[name];
    
    if (typeof template === 'function') {
      return template(this.usingTsc);
    }

    return template;
  };
}
