import { pageSettingsTablePageKey } from '../constants/pageSettings';
import { PageFileStructure } from '../models/page.model';
import { TablePageConfig } from '../models/tablePage.model';

interface GetTablePageParams {
  pageId: string;
  usingTsc: boolean;
  tablePageConfig: TablePageConfig;
  dataSourceName: string;
}

/**
 * Get the table page structure.
 * @param pageId The page ID.
 * @returns The default page structure.
 */
export function getTablePage({ pageId, usingTsc, tablePageConfig, dataSourceName }: GetTablePageParams): PageFileStructure {
  const fileContent = `import { TablePage } from '@kottster/react';\nimport { app } from '${usingTsc ? '@' : '../..'}/.server/app';\nimport dataSource from '${usingTsc ? '@' : '../..'}/.server/data-sources/${dataSourceName}';\nimport pageSettings from './settings.json';\n\nexport const action = app.defineTableController(dataSource, {\n  ...pageSettings,\n  rootTable: {\n    ...pageSettings.rootTable,\n    /**\n     * Need more customization? Adjust the table configuration here.\n     * Learn more: https://docs.kottster.app/table/configuration/api#parameters\n     */\n  }\n});\n\nexport default () => (\n  <TablePage />\n);\n`;
  const fileName = `index.${usingTsc ? 'tsx' : 'jsx'}`;

  return {
    pageId,
    dirPath: `app/routes/${pageId}`,
    entryFile: {
      fileName,
      filePath: `app/routes/${pageId}/${fileName}`,
      fileContent,
    },
    files: [
      {
        fileName: 'settings.json',
        filePath: `app/routes/${pageId}/settings.json`,
        fileContent: JSON.stringify({ 
          _version: '1',
          [pageSettingsTablePageKey]: tablePageConfig,
        }, null, 2),
      }
    ]
  }
}