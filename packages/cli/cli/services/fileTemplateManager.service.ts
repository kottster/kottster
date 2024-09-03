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
          "lib": ["dom", "dom.iterable", "esnext"],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": true,
          "noEmit": true,
          "esModuleInterop": true,
          "module": "esnext",
          "moduleResolution": "bundler",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "incremental": true,
          "plugins": [
            {
              "name": "next"
            }
          ],
          "paths": {
            "@/*": ["./src/*"]
          }
        },
        "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        "exclude": ["node_modules"]
      }
    `),

    'src/server/trpc.js': stripIndent(`
      import { AppContext } from '@kottster/common';
      import { initTRPC } from '@trpc/server';
      import { DataSourceContextToClientMap } from './data-sources/registry';

      export const t = initTRPC.context<AppContext & DataSourceContextToClientMap>().create();
    `),

    'src/server/routers/page-routers.generated.js': stripIndent(`
      export default {};
    `),

    'src/server/main.js': () => stripIndent(`
      import 'server-only';
      import { getEnvOrThrow } from '@kottster/common';
      import { createApp } from '@kottster/server';
      import { dataSourceRegistry } from './data-sources/registry';

      export const app = createApp({
        appId: getEnvOrThrow('APP_ID'),
        secretKey: getEnvOrThrow('SECRET_KEY'),
      });

      app.registerDataSources(dataSourceRegistry);
    `),

    'src/server/data-sources/postgres/index.js': usingTsc => stripIndent(`
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

    'src/server/data-sources/mysql/index.js': usingTsc => stripIndent(`
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

    'src/server/data-sources/mariadb/index.js': usingTsc => stripIndent(`
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

    'src/server/data-sources/mssql/index.js': usingTsc => stripIndent(`
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

    'src/server/data-sources/registry.js': usingTsc => stripIndent(`
      import { DataSourceRegistry } from '@kottster/server';

      export const dataSourceRegistry = new DataSourceRegistry([]);

      ${usingTsc ? `export type DataSourceContextToClientMap = {};` : ''}
    `),

    'src/middleware.js': stripIndent(`
      import { NextRequest } from 'next/server';
      import { middleware as kottsterAppMiddleware } from '@kottster/next';

      export function middleware(req: NextRequest) {
        /**
         * The middleware ensures that all requests to the protected paths are authenticated.
         * Learn more: https://kottster.gitbook.io/docs
         */
        return kottsterAppMiddleware(req, {
          protectedPaths: ['/trpc', '/kottster-api'],
        });
      }
    `),

    'src/app/route.js': stripIndent(`
      import 'server-only';
      import { app } from '@/server/main';
      import { appRouter } from '../server/routers/_app';

      const handler = app.getRootHandler(appRouter);

      export { handler as GET, handler as POST };
    `),

    'src/app/not-found.jsx': stripIndent(`
      'use client';

      import { useAutoReload } from "@kottster/react";

      export default function NotFound() {
        useAutoReload(500);
        return null;
      }
    `),

    'src/app/utils/trpc.js': stripIndent(`
      import { createTRPCReact } from '@trpc/react-query';
      import { type AppRouter } from '@/server/routers/_app';

      export const trpc = createTRPCReact<AppRouter>();
    `),

    'src/app/layout.jsx': stripIndent(`
      'use client';

      import { KottsterApp, getAuthorizationHeaders } from "@kottster/react";
      import { AntdRegistry } from '@ant-design/nextjs-registry';
      import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
      import { ConfigProvider } from "antd";
      import { appTheme } from "@kottster/react";
      import { trpc } from "./utils/trpc";
      import { httpBatchLink } from "@trpc/client";
      import { useState } from "react";
      import '@kottster/react/dist/style.css';

      const QueryProviders = ({ children }: { children: React.ReactNode }) => {
        const [queryClient] = useState(() => new QueryClient());
        const [trpcClient] = useState(() =>
          trpc.createClient({
            links: [
              httpBatchLink({ 
                url: '/trpc', 
                headers: () => getAuthorizationHeaders(),
              }),
            ],
          }),
        );

        return (
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          </trpc.Provider>
        )
      }

      export default function RootLayout({
        children,
      }: Readonly<{
        children: React.ReactNode;
      }>) {
        return (
          <html lang="en">
            <body>
              <AntdRegistry>
                <ConfigProvider theme={appTheme}>
                  <KottsterApp.Provider>
                    <QueryProviders>
                      {children}
                    </QueryProviders>

                    <KottsterApp.OverlayManager />
                  </KottsterApp.Provider>
                </ConfigProvider>
              </AntdRegistry>
            </body>
          </html>
        );
      }
    `),

    'next.config.mjs': stripIndent(`
      import { corsHeaders } from '@kottster/next';

      /** @type {import('next').NextConfig} */
      const nextConfig = {
        experimental: {
          serverComponentsExternalPackages: ['knex'],
        },
        async headers() {
          return [
            {
              source: '/:path*',
              headers: Object.entries(corsHeaders).map(([key, value]) => ({ key, value }))
            }
          ]
        }
      };

      export default nextConfig;
    `),

    'src/server/routers/_app.js': stripIndent(`
      import { t } from '../trpc';
      import pageRoutes from './page-routers.generated';

      export const appRouter = t.router(pageRoutes);

      export type AppRouter = typeof appRouter;
    `),

  };

  /**
   * Get a template
   * @param name Template name
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
