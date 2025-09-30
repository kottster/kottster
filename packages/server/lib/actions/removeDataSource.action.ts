import { InternalApiBody, InternalApiResult } from "@kottster/common";
import { DevAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";

/**
 * Verify and add data source to the project
 */
export class RemoveDataSource extends DevAction {
  public async execute(data: InternalApiBody<'removeDataSource'>): Promise<InternalApiResult<'removeDataSource'>> {
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });

    fileWriter.removeDataSource(data.name);
  }
}