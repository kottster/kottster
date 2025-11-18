import { DataSourceType, stripIndent, dataSourcesTypeData, InternalApiInput, InternalApiResult } from "@kottster/common";
import { exec } from "child_process";
import spawn from 'cross-spawn';
import { PROJECT_DIR } from "../constants/projectDir";
import { DevAction } from "../models/action.model";
import randomstring from 'randomstring';
import path from "path";
import fs from "fs";

/**
 * Verify and add data source to the project
 */
export class AddDataSource extends DevAction {
  private readonly dbDataStartMarker = '__DB_DATA_START__';
  private readonly dbDataEndMarker = '__DB_DATA_END__';
  private readonly dbDataRegex = new RegExp(`${this.dbDataStartMarker}(.*?)${this.dbDataEndMarker}`, 's');

  private readonly dbErrorStartMarker = '__DB_ERROR_START__';
  private readonly dbErrorEndMarker = '__DB_ERROR_END__';
  private readonly dbErrorRegex = new RegExp(`${this.dbErrorStartMarker}(.*?)${this.dbErrorEndMarker}`, 's');

  public async execute(data: InternalApiInput<'addDataSource'>): Promise<InternalApiResult<'addDataSource'>> {
    return new Promise((resolve, reject) => {
      const { type, connectionDetails, name } = data;
      const executableCode = this.getExecutableCode(type, connectionDetails);

      if (!Object.values(DataSourceType).includes(type)) {
        reject(new Error(`Unsupported data source type: ${type}`));
        return;
      }

      // Create local tmp file inside project
      const tmpDir = path.join(PROJECT_DIR, 'tmp');
      try {
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      } catch (err) {
        return reject(new Error(`Failed to create tmp folder: ${err}`));
      }
      const tempFilePath = path.join(tmpDir, `data-source-connection-check-${Date.now()}.mjs`);
      try {
        fs.writeFileSync(tempFilePath, executableCode, 'utf8');
      } catch (err) {
        return reject(new Error(`Failed to write temp file: ${err}`));
      }

      // Run the temp file in a child process
      const child = spawn('node', ['--no-warnings', tempFilePath], {
        stdio: 'pipe'
      });

      // Capture stdout
      let stdOutput = '';
      child.stdout.on('data', (data) => {
        stdOutput += data.toString();
      });
      
      // Capture error output
      let errorOutput = '';
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      // Handle process close
      child.on('close', (code) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempFilePath);
          // eslint-disable-next-line no-empty
        } catch {}

        // Parse the received data
        const dbDataMatch = stdOutput.match(this.dbDataRegex);
        let data = {
          tableCount: 0,
          tablesHavePrimaryKeys: false,
        };
        if (dbDataMatch && dbDataMatch[1]) {
          try {
            data = JSON.parse(dbDataMatch[1]);
          } catch (err) {
            console.warn('Could not parse database info:', err);
          }
        }

        // Parse the error output
        const dbErrorMatch = stdOutput.match(this.dbErrorRegex);
        let errorMessage = '';
        if (dbErrorMatch && dbErrorMatch[1]) {
          try {
            errorMessage = dbErrorMatch[1];
            
            // Remove quotes from the error message if they exist
            if (errorMessage.startsWith(`"`) && errorMessage.endsWith(`"`)) {
              errorMessage = errorMessage.slice(1, -1);
            }
          } catch (err) {
            console.warn('Could not parse database error:', err);
          }
        }

        // Handle errors
        if (code !== 0) {
          reject(new Error(errorOutput || stdOutput || 'Process failed'));
          return;
        }
        if (errorMessage) {
          reject(new Error(errorMessage));
          return;
        }
        const tableCount = data.tableCount || 0;

        // If no tables were found, reject with an error
        if (tableCount === 0) {
          reject(new Error(`No tables were found in your database. ${connectionDetails.searchPath ? `Please check if the schema name "${connectionDetails.searchPath}" is correct.` : `Please check if the connection details are correct.`}`));
          return;
        }

        // If tables do not have primary keys, reject with an error
        if (!data.tablesHavePrimaryKeys) {
          reject(new Error(`Seems like we can't detect primary keys in any of your database tables. The probable reason is that the database user you are using does not have enough permissions to access this information. Please make sure the user has sufficient privileges.`));
          return;
        }

        const postfix = randomstring.generate({
          length: 6,
          charset: '1234567890abcdefghijklmnopqrstuvwxyz'
        });
        const dataSourceName = name || `${type}_db_${postfix}`;

        const command = this.getCommand(type, dataSourceName, connectionDetails);
        exec(command, { cwd: PROJECT_DIR }, error => {
          if (error) {
            console.error(`Error executing command: ${error}`);
            return;
          }

          resolve();
        });
      });
      
      // Handle spawn errors
      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  private getExecutableCode(type: DataSourceType, connectionDetails: InternalApiInput<'addDataSource'>['connectionDetails']) {
    const dataSourceData = dataSourcesTypeData[type];

    const adapterClassName = this.getAdapterClassName(type);

    return stripIndent(`
      import knex from 'knex';
      import { createDataSource, ${adapterClassName} } from '@kottster/server';
      
      const dataSource = createDataSource({
        type: '${type}',
        name: '${type}',
        init: () => {
          const client = knex({
            client: '${dataSourceData.knexClientStr}',
            connection: ${JSON.stringify(connectionDetails.connection)},
            ${connectionDetails.searchPath ? `searchPath: ${JSON.stringify(connectionDetails.searchPath)},` : ''}
          });

          return new ${adapterClassName}(client);
        },
        tablesConfig: {}
      });

      try {
        const client = dataSource.adapter.getClient();
        const databaseSchema = await dataSource.adapter.getDatabaseSchema();
        const tablesHavePrimaryKeys = await dataSource.adapter.checkIfAnyTableHasPrimaryKey(databaseSchema);
        process.stdout.write('${this.dbDataStartMarker}' + JSON.stringify({ tableCount: databaseSchema.tables.length, tablesHavePrimaryKeys }) + '${this.dbDataEndMarker}');
      } catch (err) {
        process.stdout.write('${this.dbErrorStartMarker}' + JSON.stringify((err && err.message) ? err.message : err) + '${this.dbErrorEndMarker}');
      } finally {
        process.exit(0); 
      }
    `);
  }

  private getCommand(type: DataSourceType, name: string, connectionDetails: InternalApiInput<'addDataSource'>['connectionDetails']) {
    const dataOption = Buffer.from(JSON.stringify(connectionDetails)).toString('base64');

    return `npm run dev:add-data-source ${type} -- --skipInstall --name "${name}" --data "${dataOption}"`;
  }

  private getAdapterClassName(type: DataSourceType) {
    switch (type) {
      case DataSourceType.postgres:
        return 'KnexPgAdapter';
      case DataSourceType.mysql:
      case DataSourceType.mariadb:
        return 'KnexMysql2Adapter';
      case DataSourceType.sqlite:
        return 'KnexBetterSqlite3Adapter';
      case DataSourceType.mssql:
        return 'KnexTediousAdapter';
      default:
        throw new Error(`Unsupported data source type: ${type}`);
    }
  }


}