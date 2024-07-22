import { PublicDataSource } from "./dataSource.model";
import { Page } from "./page.module";
import { Procedure } from "./procedure.model";

// Contains basic page information
export interface AppSchema {
  version: number;
  pages: Page[];
}

// Contains full page information and full procedures
export interface FullAppSchema extends AppSchema {
  id: string;
  dataSources: PublicDataSource[];
  procedures: Procedure[];
}
