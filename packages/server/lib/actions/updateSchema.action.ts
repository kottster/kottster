import { DSAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";
import { FullAppSchema } from "@kottster/common";

interface Data extends FullAppSchema {}

/**
 * Update the app schema file (kottster-app.json)
 */
export class UpdateSchema extends DSAction {
  public async execute(data: Data) {
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });

    fileWriter.writeSchemaJsonFile(data);

    return {};
  }
}