import { InternalApiInput, InternalApiResult, Stage } from "@kottster/common";
import { DevAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { FileWriter } from "../services/fileWriter.service";

/**
 * Update the app schema with the provided data.
 */
export class UpdateAppSchema extends DevAction {
  public async execute(data: InternalApiInput<'updateAppSchema'>): Promise<InternalApiResult<'updateAppSchema'>> {
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    const fileReader = new FileReader(this.app.stage === Stage.development);
    const { sidebar } = data;
    const appSchema = fileReader.readAppSchema();

    if (sidebar) {
      fileWriter.writeSidebarSchemaJsonFile({
        ...appSchema.sidebar,
        ...sidebar
      });
    }
  }
}