import { Action } from "../models/action.model";
import { DataSourceAdapter } from "../models/dataSourceAdapter.model";
import { FileReader } from "../services/fileReader.service";
import { FullAppSchema, PublicDataSource } from "@kottster/common";

interface Result extends FullAppSchema {};

/**
 * Get the app schema.
 * @description Returns combined schema.json and additional data.
 */
export class GetSchema extends Action {
  public async execute(): Promise<Result> {
    const { appId, dataSources } = this.app;
    
    const fileReader = new FileReader();
    const appSchema = fileReader.readSchemaJson();

    return {
      ...appSchema,
      id: appId,
      usingTsc: this.app.usingTsc,
      dataSources: dataSources.map(ds => ({ 
        type: ds.type,
        contextPropName: ds.contextPropName,
        adapterType: (ds.adapter as DataSourceAdapter).type
      } as PublicDataSource)),
      procedures: this.app.getProcedures(),
      sandbox: {
        developmentServerUrl: process.env.VITE_DEV_SERVER_URL
      }
    };
  }
}