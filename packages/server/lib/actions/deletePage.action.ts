import { InternalApiBody, InternalApiResult, Stage } from "@kottster/common";
import { DevAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { FileWriter } from "../services/fileWriter.service";

/**
 * Delete a page
 */
export class DeletePage extends DevAction {
  public async execute(data: InternalApiBody<'deletePage'>): Promise<InternalApiResult<'deletePage'>> {
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    const fileReader = new FileReader(this.app.stage === Stage.development);
    const { key } = data;
    const appSchema = fileReader.readSchemaJsonFile();
    
    // Remove page directory or file
    fileWriter.removePage(key);

    // Remove page ID from menuPageOrder if it exists
    if (appSchema.menuPageOrder?.includes(key)) {
      appSchema.menuPageOrder = appSchema.menuPageOrder.filter(pageKey => pageKey !== key);
      fileWriter.writeSchemaJsonFile(appSchema);
    }
  }
}