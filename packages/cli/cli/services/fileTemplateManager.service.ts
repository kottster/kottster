import { stripIndent } from "@kottster/common";

type TemplateVars = {
  'vite.config.js': undefined;
  'tsconfig.json': undefined;
  'app/_server/app.js': undefined;
  'app/_server/server.js': undefined;
  'app/_server/data-sources/postgres/index.js': {
    connection?: string | {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
    searchPath?: string;
  };
  'app/_server/data-sources/mysql/index.js': {
    connection?: string | {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
  };
  'app/_server/data-sources/mariadb/index.js': {
    connection?: string | {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
  };
  'app/_server/data-sources/sqlite/index.js': {
    connection?: {
      filename: string;
    };
  };
  'app/_server/data-sources/mssql/index.js': {
    connection?: string | {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
    searchPath?: string;
  };
  'app/index.html': undefined;
  'app/main.jsx': undefined;
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
    'vite.config.js': () => stripIndent(`
      import { defineConfig } from 'vite';
      import { vitePlugin as kottster } from '@kottster/react';
      import react from '@vitejs/plugin-react';

      export default defineConfig({
        root: './app',
        server: {
          port: 5480,
          open: false,
        },
        build: {
          outDir: '../dist/client',
          emptyOutDir: true,
          chunkSizeWarningLimit: 1000,
        },
        plugins: [
          kottster(),
          react(),
        ],
        resolve: {
          alias: {
            '@': '/app'
          }
        },
      });
    `),
    
    'tsconfig.json': stripIndent(`
      {
        "include": [
          "**/app/**/*.ts",
          "**/app/**/*.tsx",
          "**/_server/**/*.ts",
          "**/_server/**/*.tsx",
          "**/.client/**/*.ts",
          "**/.client/**/*.tsx"
        ],
        "compilerOptions": {
          "lib": ["DOM", "DOM.Iterable", "ES2022"],
          "types": ["@types/node", "vite/client"],
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
          "outDir": "./dist",
          "paths": {
            "@/*": ["./app/*"]
          },
          "noEmit": true
        }
      }
    `),

    'app/_server/app.js': stripIndent(`
      import { createApp } from '@kottster/server';
      import schema from '../../kottster-app.json';

      export const app = createApp({
        schema,

        /* 
        * For security, consider moving the secret key to an environment variable: 
        * https://kottster.app/docs/deploying#before-you-deploy
        */
        secretKey: process.env.SECRET_KEY,
      });
    `),

    'app/_server/server.js': stripIndent(`
      import { app } from './app';

      async function bootstrap() {
        // Use the PORT environment variable to set the port in production
        await app.listen();
      }

      bootstrap().catch(err => {
        console.error(err);
        process.exit(1);
      });
    `),

    'app/_server/data-sources/postgres/index.js': (usingTsc, vars) => stripIndent(`
      import { KnexPgAdapter } from '@kottster/server';
      import knex from 'knex';
      
      /**${!vars.connection ? ` \n         * Replace the following with your connection options. ` : ''}
       * Learn more at https://knexjs.org/guide/#configuration-options
       */
      const client = knex({
        client: 'pg',
        connection: ${typeof vars.connection !== 'object' ? `'${vars.connection || 'postgresql://myuser:mypassword@localhost:5432/mydatabase'}',` : `{
          host: '${vars.connection.host || 'localhost'}',
          port: ${vars.connection.port ? Number(vars.connection.port) : '5432'},
          user: '${vars.connection.user || 'myuser'}',
          password: '${vars.connection.password || 'mypassword'}',
          database: '${vars.connection.database || 'mydatabase'}',
        },`}
        searchPath: ['${vars.searchPath || 'public'}'],
      });

      export default new KnexPgAdapter(client);
    `),

    'app/_server/data-sources/mysql/index.js': (usingTsc, vars) => stripIndent(`
      import { KnexMysql2Adapter } from '@kottster/server';
      import knex from 'knex';
      
      /**${!vars.connection ? ` \n         * Replace the following with your connection options. ` : ''}
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

      export default new KnexMysql2Adapter(client);
    `),

    'app/_server/data-sources/mariadb/index.js': (usingTsc, vars) => stripIndent(`
      import { KnexMysql2Adapter } from '@kottster/server';
      import knex from 'knex';
      
      /**${!vars.connection ? ` \n         * Replace the following with your connection options. ` : ''}
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

      export default new KnexMysql2Adapter(client);
    `),

    'app/_server/data-sources/mssql/index.js': (usingTsc, vars) => stripIndent(`
      import { KnexTediousAdapter } from '@kottster/server';
      import knex from 'knex';
      
      /**
       * Learn more at https://knexjs.org/guide/#configuration-options
       */
      const client = knex({
        client: 'mssql',
        connection: ${typeof vars.connection !== 'object' ? `'${vars.connection || 'mysql://myuser:mypassword@localhost:3306/mydatabase'}',` : `{
          host: '${vars.connection.host || 'localhost'}',
          port: ${vars.connection.port ? Number(vars.connection.port) : '5432'},
          user: '${vars.connection.user || 'myuser'}',
          password: '${vars.connection.password || 'mypassword'}',
          database: '${vars.connection.database || 'mydatabase'}',
        },`}
        searchPath: ['${vars.searchPath || 'dbo'}'],
      });

      export default new KnexTediousAdapter(client);
    `),

    'app/_server/data-sources/sqlite/index.js': (usingTsc, vars) => stripIndent(`
      import { KnexBetterSqlite3Adapter } from '@kottster/server';
      import knex from 'knex';
      
      /**${!vars.connection ? ` \n         * Replace the following with your connection options. ` : ''}
       * Learn more at https://knexjs.org/guide/#configuration-options
       */
      const client = knex({
        client: 'better-sqlite3',
        connection: {
          filename: '${vars.connection?.filename || '/path/to/database.sqlite'}',
        }
      });

      export default new KnexBetterSqlite3Adapter(client);
    `),

    'app/index.html': usingTsc => stripIndent(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <link rel="icon" type="image/png" href="https://web.kottster.app/icon.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Kottster App</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="./main.${usingTsc ? 'tsx' : 'jsx'}"></script>
        </body>
      </html>
    `),

    'app/main.jsx': usingTsc => stripIndent(`
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      import { MantineProvider } from '@mantine/core';
      import { KottsterApp } from '@kottster/react';
      import '@kottster/react/dist/style.css';

      const pageEntries = import.meta.glob('./pages/**/index.${usingTsc ? `{jsx,tsx}` : 'jsx'}', { eager: true });

      ReactDOM.createRoot(document.getElementById('root')${usingTsc ? '!' : ''}).render(
        <React.StrictMode>
          <KottsterApp pageEntries={pageEntries} />
        </React.StrictMode>
      );
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
