import { Action } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { FullAppSchema, PublicDataSource } from "@kottster/common";

interface Result extends FullAppSchema {};

/**
 * Get the schema of the app.
 * Includes all pages with components and procedures.
 */
export class GetSchema extends Action {
  public async execute(): Promise<Result> {
    const { appId, dataSources } = this.app;
    
    const fileReader = new FileReader();
    const appSchema = fileReader.readSchemaJson();

    return {
      ...appSchema,
      id: appId,
      dataSources: dataSources.map(ds => ({ 
        type: ds.type,
        contextPropName: ds.contextPropName,
      } as PublicDataSource)),
      procedures: this.app.getProcedures()
    };
  }
}