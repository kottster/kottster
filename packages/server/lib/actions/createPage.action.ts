import { InternalApiBody, InternalApiResult, Stage } from "@kottster/common";
import { DevAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { FileWriter } from "../services/fileWriter.service";

/**
 * Create a new empty page
 */
export class CreatePage extends DevAction {
  public async execute(data: InternalApiBody<'createPage'>): Promise<InternalApiResult<'createPage'>> {
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    const fileReader = new FileReader(this.app.stage === Stage.development);
    const appSchema = fileReader.readSchemaJsonFile();

    // Add page file
    if (data.file) {
      fileWriter.writePageToFile(data.file);
    }

    // Add page to menuPageOrder
    if (appSchema.menuPageOrder) {
      appSchema.menuPageOrder.push(data.key);
    } else {
      appSchema.menuPageOrder = [data.key];
    }
    fileWriter.writeSchemaJsonFile(appSchema);
  }
}