import { DataSourceType } from "./dataSource.model";
import { PublicPage } from "./page.model";

export interface PublicAppSchemaDataSourceConfig {
  name: string;
  type: keyof typeof DataSourceType;
}

// App schema that is stored in the configuration file
export interface AppSchema {
  id: string;

  meta: {
    name: string;
    icon: string;
  };

  /**
   * The order of pages in the menu.
   */
  menuPageOrder?: string[];
}

// App schema that is passed to the client.
export interface ClientAppSchema extends Pick<AppSchema, 'id' | 'meta' | 'menuPageOrder'> {
  dataSources: PublicAppSchemaDataSourceConfig[];

  /**
   * Defined pages in the project.
   */
  pages: PublicPage[];
}

// When the schema is empty, app will use this placeholder
export const schemaPlaceholder: AppSchema | ClientAppSchema = {
  id: '', 
  meta: {
    name: 'Kottster App',
    icon: 'https://web.kottster.app/icon.png',
  },
  pages: [],
  dataSources: [],
};
