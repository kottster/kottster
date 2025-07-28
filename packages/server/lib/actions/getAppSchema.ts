import { ClientAppSchema } from "@kottster/common";
import { Action } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";

/**
 * Get the app schema
 */
export class GetAppSchema extends Action {
  public async execute(): Promise<ClientAppSchema> {
    const fileReader = new FileReader();
    const appSchema = fileReader.readSchemaJsonFile();
    const pages = fileReader.getPageConfigs();

    return {
      ...appSchema,
      pages,
      dataSources: this.app.dataSources.map((dataSource) => {
        return {
          name: dataSource.name,
          type: dataSource.type,
        };
      }),
    };
  }
}