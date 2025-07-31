import { File } from './file.model'
import { TablePageConfig } from './tablePage.model';

export enum PageType {
  table = 'table',
  custom = 'custom',
}

interface BasePage {
  version: string;
  key: string;
  title?: string;
  icon?: string;
  allowedRoleIds?: string[];
  hideInSidebar?: boolean;
}

interface TablePage extends BasePage {
  type: 'table';
  config: TablePageConfig;
}

interface CustomPage extends BasePage {
  type: 'custom';
  key: string;
  title: string;
}

export type Page = TablePage | CustomPage;

interface PublicTablePage extends Pick<TablePage, 'key' | 'title' | 'icon' | 'type' | 'allowedRoleIds' | 'version' | 'hideInSidebar'> {
  config: TablePage['config'];
}

interface PublicCustomPage extends Pick<CustomPage, 'key' | 'title' | 'icon' | 'type' | 'allowedRoleIds' | 'version' | 'hideInSidebar'> {}

export type PublicPage = PublicTablePage | PublicCustomPage;

export interface PageFileStructure {
  pageKey: string;

  // Root directory of the page
  // Example: src/client/pages/<pageKey>
  dirPath: string;
  
  // Files in the page directory, does not include entry file
  files?: File[];
}
