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

    'src/server/app.js': this.stripIndent(`
      import { getEnvOrThrow } from '@kottster/common';
      import { createApp } from '@kottster/server';

      export const app = createApp({
        appId: getEnvOrThrow('APP_ID'),
        secretKey: getEnvOrThrow('SECRET_KEY'),
      });
    `),

    'src/server/main.js': this.stripIndent(`
      import { app } from './app.js';
      import { getEnvOrThrow } from '@kottster/common';
      import procedures from '../__generated__/server/procedures.generated.js';

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
