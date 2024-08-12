import { Action } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";
import { FullAppSchema } from "@kottster/common";

interface Data extends FullAppSchema {}

/**
 * Update the app schema
 * @description Updates the schema.json file and creates/removes pages as needed.
 */
export class UpdateSchema extends Action {
  public async execute(data: Data) {
    const { version, pages } = data;
    
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    
    fileWriter.writeSchemaJsonFile({
      version,
      pages,
    });

    return {};
  }
}