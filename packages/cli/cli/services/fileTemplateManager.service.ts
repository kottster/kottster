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
                route('/-/*', 'service-route.ts');
              });
            },
          }),
          tsconfigPaths(),
          viteCommonjs({
            include: ['util'],
          }),
        ],
        optimizeDeps: {
          include: [
            'react',
            'react-dom',
            'react-feather',
            '@mantine/core',
            '@mantine/dates',
            '@mantine/charts',
            '@mantine/hooks',
            '@mantine/modals',
            '@mantine/form',
            '@mantine/notifications',
            '@tanstack/react-query',
            '@trpc/react-query',
            'dayjs',
            'recharts',
          ],
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

    'app/.server/trpc.js': stripIndent(`
      import { AppContext } from '@kottster/common';
      import { initTRPC } from '@trpc/server';
      import { DataSourceContextToClientMap } from './data-sources/registry';

      export const t = initTRPC.context<AppContext & DataSourceContextToClientMap>().create();
    `),

    'app/.server/trpc-routers/page-routers.generated.js': stripIndent(`
      // This file is auto-generated. Do not modify it manually.
      // It exports all api.server.(ts|js) files in the app/routes directory.

      export default {};
    `),

    'app/.server/app.js': (_usingTsc: boolean, vars: Record<string, string>) => stripIndent(`
      import { createApp } from '@kottster/server';
      import { dataSourceRegistry } from './data-sources/registry';
      import schema from '../../app-schema.json';

      export const app = createApp({
        schema,
        appId: '${vars.appId}',
        secretKey: '${vars.secretKey}',

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
        ctxPropName: 'knex',
        databaseSchemas: ['public'],
        init: () => {
          /**
           * Replace the following with your connection options.
           * Read more at https://knexjs.org/guide/#configuration-options
           */
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

    'app/.server/data-sources/mysql/index.js': (usingTsc: boolean) => stripIndent(`
      import { createDataSource, KnexMysql2Adapter } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.mysql` : `'mysql'`},
        ctxPropName: 'knex',
        databaseSchemas: ['public'],
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
        ctxPropName: 'knex',
        databaseSchemas: ['public'],
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
        ctxPropName: 'knex',
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

    'app/.server/data-sources/registry.js': (usingTsc: boolean) => stripIndent(`
      import { DataSourceRegistry } from '@kottster/server';

      export const dataSourceRegistry = new DataSourceRegistry([]);

      ${usingTsc ? `export type DataSourceContextToClientMap = {};` : ''}
    `),

    'app/.server/trpc-routers/app-router.js': stripIndent(`
      import { t } from '../trpc';
      import pageRoutes from './page-routers.generated';

      export const appRouter = t.router(pageRoutes ?? []);

      export type AppRouter = typeof appRouter;
    `),

    'app/root.jsx': stripIndent(`
      import { useState } from 'react';
      import { Outlet } from '@remix-run/react';
      import { QueryClient } from '@tanstack/react-query';
      import { KottsterApp, ClientOnly, RootLayout, RootErrorBoundary, getTRPCClientLinks } from '@kottster/react';
      import { Notifications } from '@mantine/notifications';
      import { trpc } from './trpc.client';
      import '@kottster/react/dist/style.css';

      function ClientApp() {
        const [queryClient] = useState(() => new QueryClient());
        const [trpcClient] = useState(() => trpc.createClient({ links: getTRPCClientLinks() }));

        return (
          <KottsterApp.Provider trpc={trpc} trpcClient={trpcClient} queryClient={queryClient}>
            <Outlet />
            <KottsterApp.OverlayManager />
            <Notifications />
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

      export { RootLayout as Layout, RootErrorBoundary as ErrorBoundary };
    `),

    'app/service-route.js': stripIndent(`
      import { app } from '@/.server/app';
      import { appRouter } from '@/.server/trpc-routers/app-router';
      import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

      export const loader = async (args: LoaderFunctionArgs) => {
        return app.createServiceRouteLoader(appRouter)(args);
      };

      export const action = async (args: ActionFunctionArgs) => {
        return app.createServiceRouteLoader(appRouter)(args);
      };
    `),

    'app/entry.client.jsx': stripIndent(`
      import { RemixBrowser } from '@remix-run/react';
      import { startTransition, StrictMode } from 'react';
      import { hydrateRoot } from 'react-dom/client';

      startTransition(() => {
        hydrateRoot(
          document,
          <StrictMode>
            <RemixBrowser />
          </StrictMode>
        );
      });
    `),

    'app/trpc.client.js': stripIndent(`
      import { createTRPCReact } from '@trpc/react-query';
      import { type AppRouter } from '@/.server/trpc-routers/app-router';

      export const trpc = createTRPCReact<AppRouter>();
    `),

  };

  /**
   * Get a template
   * @param name Template name
   * @param vars Variables to replace in the template
   * @returns The file content
   */
  public getTemplate(name: keyof typeof FileTemplateManager.templates, vars: Record<string, string> = {}): string {
    const template = FileTemplateManager.templates[name];
    if (!template) {
      throw new Error(`Template ${name} not found`);
    }
    
    if (typeof template === 'function') {
      return template(this.usingTsc, vars);
    }

    return template;
  };
}
