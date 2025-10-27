import { Page, SidebarJsonSchema, TablePageConfig } from '@kottster/common';
import fs from 'fs';
import path from 'path';

/**
 * Service that runs post-upgrade migrations
 */
export class PostUpgradeMigrationManager {
  constructor(private readonly projectDir: string) {}

  runMigrations() {
    this.runMigrationForMissingSidebarSchemaFile();
    this.runMigrationForPageConfigurations();
  }

  private logMigration(message: string) {
    console.log(`[Post-upgrade migration] ${message}`);
  }

  /**
   * Create app/schemas/sidebar.json file if it does not exist and kottster-app.json contains menuPageOrder.
   * Needed for projects upgraded from versions before v3.4.0
   */
  runMigrationForMissingSidebarSchemaFile() {
    // If app/schemas/sidebar.json does not exist
    const sidebarSchemaPath = path.join(this.projectDir, 'app', 'schemas', 'sidebar.json');
    const sidebarSchemaExists = fs.existsSync(sidebarSchemaPath);
    if (sidebarSchemaExists) {
      return;
    }

    // If kottster-app.json file exists and contains menuPageOrder
    const configPath = path.join(this.projectDir, 'kottster-app.json');
    if (!fs.existsSync(configPath)) {
      return;
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const hasMenuPageOrder = config.menuPageOrder && Array.isArray(config.menuPageOrder);
    if (!hasMenuPageOrder) {
      return;
    }

    this.logMigration(`Creating app/schemas/sidebar.json file based on kottster-app.json`);

    // Create sidebar.json schema file based on menuPageOrder
    const sidebarJsonSchema: SidebarJsonSchema = {
      menuPageOrder: config.menuPageOrder,
    };
    fs.mkdirSync(path.dirname(sidebarSchemaPath), { recursive: true });
    fs.writeFileSync(sidebarSchemaPath, JSON.stringify(sidebarJsonSchema, null, 2), 'utf-8');

    // Remove menuPageOrder from kottster-app.json
    delete config.menuPageOrder;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  runMigrationForPageConfigurations() {
    // Get all app/pages/*/page.json files
    const pagesDir = path.join(this.projectDir, 'app', 'pages');
    if (!fs.existsSync(pagesDir)) {
      return;
    }
    const pageDirs = fs.readdirSync(pagesDir);
    for (const pageDir of pageDirs) {
      const pageConfigPath = path.join(pagesDir, pageDir, 'page.json');
      if (!fs.existsSync(pageConfigPath)) {
        continue;
      }

      const pageConfig = JSON.parse(fs.readFileSync(pageConfigPath, 'utf-8')) as Page;
      if (pageConfig.version !== '1.0') {
        return;
      } 
      
      this.logMigration(`Upgrading page configuration for page '${pageDir}' from v1.0 to v3.4`);

      // Migrate pageConfig to v3.4 format
      pageConfig.version = '3.4';
      if (pageConfig.type === 'table') {
        const tablePageConfig: TablePageConfig = pageConfig.config;

        // Replace relationships array with linkedRecordsColumns array
        if (tablePageConfig.relationships) {
          tablePageConfig.linkedRecordsColumns = tablePageConfig.relationships
            .map(r => ({
              ...r,
              relationshipKey: r.key,
              key: undefined,
            }));
          delete tablePageConfig.relationships;
        }

        // Do the same for nested configs if any
        if (Object.keys(tablePageConfig.nested ?? {}).length > 0) {
          for (const nestedKey of Object.keys(tablePageConfig.nested!)) {
            const nestedConfig = tablePageConfig.nested![nestedKey];
            if (nestedConfig.relationships) {
              nestedConfig.linkedRecordsColumns = nestedConfig.relationships
                .map(r => ({
                  ...r,
                  relationshipKey: r.key,
                  key: undefined,
                }));
              delete nestedConfig.relationships;
            }
          }
        }
      }

      fs.writeFileSync(pageConfigPath, JSON.stringify(pageConfig, null, 2), 'utf-8');
    }
  }
}