import { stripIndent } from "@kottster/common";

/**
 * Service for storing file templates
 */
export class FileTemplateManager {
  constructor(
    private readonly usingTsc: boolean
  ) {}

  static templates = {
    'Dockerfile': stripIndent(`
      FROM node:18
      WORKDIR /usr/src/app
      COPY package*.json ./
      RUN npm install
      COPY . .
      RUN npm install @kottster/cli@^1.0.0 -g
      EXPOSE 5480
      CMD ["npm", "start:prod"]
    `),

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

    'src/server/app.js': stripIndent(`
      import { getEnvOrThrow } from '@kottster/common';
      import { createApp } from '@kottster/server';

      export const app = createApp({
        appId: getEnvOrThrow('APP_ID'),
        secretKey: getEnvOrThrow('SECRET_KEY'),
      });
    `),

    'src/server/main.js': () => stripIndent(`
      import { app } from './app';
      import { getEnvOrThrow } from '@kottster/common';
      import procedures from '../__generated__/server/procedures.generated';

      app.registerProcedures(procedures);

      app.start(getEnvOrThrow('PORT') ?? 5480);
    `),

    'src/server/data-sources/postgres/index.js': (usingTsc: boolean) => stripIndent(`
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

    'src/server/data-sources/mysql/index.js': (usingTsc: boolean) => stripIndent(`
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

    'src/server/data-sources/mariadb/index.js': (usingTsc: boolean) => stripIndent(`
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

    'src/server/data-sources/mssql/index.js': (usingTsc: boolean) => stripIndent(`
      import { createDataSource } from '@kottster/server';
      import knex from 'knex';
      ${usingTsc ? "import { DataSourceType } from '@kottster/common';\n" : ""}
      const dataSource = createDataSource({
        type: ${usingTsc ? `DataSourceType.mssql` : `'mssql'`},
        contextPropName: 'knex',
        databaseSchemas: ['dbo'],
        client: knex({
          // Replace the following with your connection options
          // Read more at https://knexjs.org/guide/#configuration-options
          client: 'tedious',
          connection: {
            server: 'localhost',
            port: 1433,
            user: 'your_database_user',
            password: 'your_database_password',
            database: 'myapp_test',
          },
        })
      });

      export default dataSource;
    `),

    'src/client/main.jsx': stripIndent(`
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      import { ConfigProvider } from 'antd';
      import { App, appTheme } from '@kottster/react';
      import '@kottster/react/dist/style.css';
      
      import pages from '../__generated__/client/pages.generated';

      ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
          <ConfigProvider theme={appTheme}>
            <App pages={pages} />
          </ConfigProvider>
        </React.StrictMode>
      );
    `),

    'src/client/index.html': (usingTsc: boolean) => stripIndent(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />

          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">

          <title>Kottster App</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/${usingTsc ? 'main.tsx' : 'main.jsx'}"></script>
        </body>
      </html>

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
