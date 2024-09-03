import { DSAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";
import { FullAppSchema } from "@kottster/common";

interface Data extends FullAppSchema {}

/**
 * Update the app schema
 * @description Updates the schema.json file and creates/removes pages as needed.
 */
export class UpdateSchema extends DSAction {
  public async execute(data: Data) {
    const { navItems } = data;
    const fileWriter = new FileWriter({ usingTsc: this.ds.usingTsc });
    
    fileWriter.writeSchemaJsonFile({
      navItems,
    });

    return {};
  }
}