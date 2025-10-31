import { DashboardPageConfig } from './dashboardPage.model';
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
  hideInSidebar?: boolean;

  allowedRoles?: string[];

  /**
   * @deprecated Legacy - to be removed in v4. Use `allowedRoles` instead.
   */
  allowedRoleIds?: string[];
}

interface TablePage extends BasePage {
  type: 'table';
  config: TablePageConfig;
}

interface DashboardPage extends BasePage {
  type: 'dashboard';
  config: DashboardPageConfig;
}

interface CustomPage extends BasePage {
  type: 'custom';
  key: string;
  title: string;
}

export type Page = TablePage | DashboardPage | CustomPage;

export interface PublicTablePage extends Pick<TablePage, 'key' | 'title' | 'icon' | 'type' | 'allowedRoles' | 'allowedRoleIds' | 'version' | 'hideInSidebar'> {
  config: TablePage['config'];
}

export interface PublicDashboardPage extends Pick<DashboardPage, 'key' | 'title' | 'icon' | 'type' | 'allowedRoles' | 'allowedRoleIds' | 'version' | 'hideInSidebar'> {
  config: DashboardPage['config'];
}

export interface PublicCustomPage extends Pick<CustomPage, 'key' | 'title' | 'icon' | 'type' | 'allowedRoles' | 'allowedRoleIds' | 'version' | 'hideInSidebar'> {}

export type PublicPage = PublicTablePage | PublicDashboardPage | PublicCustomPage;

export interface PageFileStructure {
  pageKey: string;

  // Root directory of the page
  // Example: src/client/pages/<pageKey>
  dirPath: string;
  
  // Files in the page directory, does not include entry file
  files?: File[];
}
