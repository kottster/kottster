import { DataSourceType } from "./dataSource.model";
import { PublicPage } from "./page.model";

/**
 * JSON-stored schema for the main configuration
 */
export interface MainJsonSchema {
  id: string;

  /**
   * The base path for the app
   * @example /admin/
   */
  basePath?: string;
  
  meta: {
    name: string;
    icon: string;
  };

  /** 
   * Kottster Enterprise Hub configuration
   * @description Configuration for connecting to the Kottster Enterprise Hub.
   */
  enterpriseHub?: {
    url: string;
  };
}

/**
 * JSON-stored schema for the sidebar configuration
 */
export interface SidebarJsonSchema {
  /**
   * The order of pages in the menu.
   */
  menuPageOrder?: string[];
}

/**
 * Unified app schema that includes all configurations
 */
export interface AppSchema {
  main: MainJsonSchema;
  sidebar: SidebarJsonSchema;
}

/**
 * Client-side app schema
 */
export interface ClientAppSchema {
  main: Pick<AppSchema['main'], 'id' | 'meta' | 'enterpriseHub' | 'basePath'>;
  sidebar: AppSchema['sidebar'];

  dataSources: {
    name: string;
    type: keyof typeof DataSourceType;
  }[];

  /**
   * Defined pages in the project.
   */
  pages: PublicPage[];
}

// When the schema is empty, app will use this placeholder
export const schemaPlaceholder: AppSchema | ClientAppSchema = {
  main: {
    id: '', 
    meta: {
      name: 'Kottster App',
      icon: 'https://web.kottster.app/icon.png',
    },
  },
  pages: [],
  dataSources: [],
  sidebar: {},
};
