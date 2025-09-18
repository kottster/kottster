import { ClientAppSchema, Page, Stage } from "@kottster/common";
import { Action } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";

/**
 * Get the app schema
 */
export class GetAppSchema extends Action {
  private cachedPages: Page[] | null = null;

  public async execute(): Promise<ClientAppSchema> {
    const fileReader = new FileReader(this.app.stage === Stage.development);

    // Cache pages in production to avoid reading files every time
    const pages = this.app.stage === Stage.production && this.cachedPages
      ? this.cachedPages
      : fileReader.getPageConfigs();
    
    if (this.app.stage === Stage.production && !this.cachedPages) {
      this.cachedPages = pages;
    }
    
    // In production, use the in-memory schema; in development, read from file
    const appSchema = this.app.stage === Stage.production ? this.app.schema : fileReader.readSchemaJsonFile();

    return {
      ...appSchema,
      pages,
      dataSources: this.app.dataSources.map((dataSource) => {
        return {
          name: dataSource.name,
          type: dataSource.type,
        };
      }),
      enterpriseHub: appSchema.enterpriseHub,
    };
  }
}