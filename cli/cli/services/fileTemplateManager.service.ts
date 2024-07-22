/**
 * Service for managing file templates
 */
export class FileTemplateManager {
  static templates = {
    'Dockerfile': this.stripIndent(`
      FROM node:18
      WORKDIR /usr/src/app
      COPY package*.json ./
      RUN npm install
      COPY . .
      RUN npm install @kottster/cli@^1.0.0 -g
      EXPOSE 5480
      CMD ["npm", "start"]
    `),

    'kottster.config.cjs': this.stripIndent(`
      const { defineConfig } = require('@kottster/server');

      module.exports = defineConfig({
        // ESBuild options for generating the client-side bundle
        // Refer to https://esbuild.github.io/api/#build-api for more options
        esbuildOptions: {
          entryPoints: ['src/__generated__/client/pages.generated.js'],
          outfile: 'dist/static/pages.js',
          bundle: true,
          minify: false,
          format: 'esm',
          target: 'es2018',
          external: ['react', 'react-dom', 'react/jsx-runtime', '@kottster/react'],
          define: {
            'process.env.NODE_ENV': '"production"'
          },
          alias: {
            'react': 'https://esm.sh/react@18.3.1',
            'react-dom': 'https://esm.sh/react-dom@18.3.1',
            'react/jsx-runtime': 'https://esm.sh/react@18.3.1/jsx-runtime',
          },
          treeShaking: true,
          minifyIdentifiers: false,
          minifySyntax: false,
          minifyWhitespace: true,
          jsxFactory: 'React.createElement',
          jsxFragment: 'React.Fragment',
          jsx: 'automatic',
        },
      });
    `),

    'src/server/app.js': this.stripIndent(`
      import { getEnvOrThrow } from '@kottster/common';
      import { createApp } from '@kottster/server';

      export const app = createApp({
        appId: getEnvOrThrow('APP_ID'),
        secretKey: getEnvOrThrow('SECRET_KEY'),
      });
    `),

    'src/server/context.js': this.stripIndent(`
      import { createContext } from '@kottster/server';

      export const context = createContext(ctx => {
        return {
          ...ctx,
          // Add your custom context properties here
        }
      }, {});
    `),

    'src/server/main.js': this.stripIndent(`
      import { app } from './app.js';
      import { context } from './context.js';
      import { getEnvOrThrow } from '@kottster/common';
      import procedures from '../__generated__/server/procedures.generated.js';

      app.setContext(context);

      app.registerProcedures(procedures);

      app.start(getEnvOrThrow('PORT') ?? 5480);
    `),

    'src/server/data-sources/postgres/index.js': this.stripIndent(`
      import { createDataSource } from '@kottster/server';
      import knex from 'knex';

      const dataSource = createDataSource({
        type: 'postgres',
        contextPropName: 'knex',
        
        clientType: 'knex_pg',
        client: knex({
          // Replace the following with your connection options
          // Read more at https://knexjs.org/guide/#configuration-options
          client: 'pg',
          connection: 'postgres://user:password@localhost:5432/database',
          searchPath: ['public'],
        })
      });

      export default dataSource;
    `),

    'src/server/data-sources/mysql/index.js': this.stripIndent(`
      import { createDataSource } from '@kottster/server';
      import knex from 'knex';

      const dataSource = createDataSource({
        type: 'postgres',
        contextPropName: 'knex',
        
        clientType: 'knex_mysql2',
        client: knex({
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
        })
      });

      export default dataSource;
    `),

    'src/server/data-sources/mariadb/index.js': this.stripIndent(`
      import { createDataSource } from '@kottster/server';
      import knex from 'knex';

      const dataSource = createDataSource({
        type: 'postgres',
        contextPropName: 'knex',
        
        clientType: 'knex_mysql2',
        client: knex({
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
        })
      });

      export default dataSource;
    `),

    'src/server/data-sources/mssql/index.js': this.stripIndent(`
      import { createDataSource } from '@kottster/server';
      import knex from 'knex';

      const dataSource = createDataSource({
        type: 'postgres',
        contextPropName: 'knex',
        
        clientType: 'knex_tedious',
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

  };

  /**
   * Get a template
   * @param name Template name
   * @returns The file content
   */
  static getTemplate(name: keyof typeof this.templates): string {
    return this.templates[name];
  };

  private static stripIndent(str: string): string {
    const match = str.match(/^[ \t]*(?=\S)/gm);
    if (!match) return str;

    const indent = Math.min(...match.map(x => x.length));
    const re = new RegExp(`^[ \\t]{${indent}}`, 'gm');
    return str.replace(re, '').trim();
  };
}
