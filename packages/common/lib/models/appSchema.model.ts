import { PublicDataSource } from "./dataSource.model";
import { NavItem } from "./navItem.model";

// App schema that will be stored in the file
export interface AppSchema {
  navItems: NavItem[];
}

// App schema that will be returned to the client
export interface FullAppSchema extends AppSchema {
  id: string;
  dataSources: PublicDataSource[];
  usingTsc: boolean;
  sandbox: {
    // Only available in development mode
    developmentServerUrl?: string;
  };

  // Only available in development mode
  devSyncServerUrl?: string;
  os?: {
    platform: string;
    type: string;
    release: string;
  };
  absoluteDirPath?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}
