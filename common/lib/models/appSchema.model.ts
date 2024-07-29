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
}
