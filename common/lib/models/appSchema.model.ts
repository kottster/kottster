import { PublicDataSource } from "./dataSource.model";
import { Page } from "./page.model";
import { Procedure } from "./procedure.model";

// App schema that will be stored in the file
export interface AppSchema {
  version: number;
  pages: Page[];
}

// App schema that will be returned to the client
export interface FullAppSchema extends AppSchema {
  id: string;
  dataSources: PublicDataSource[];
  procedures: Procedure[];
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
