import { InternalApiInput, InternalApiResult, Stage } from "@kottster/common";
import { DevAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { FileWriter } from "../services/fileWriter.service";

/**
 * Delete a page
 */
export class DeletePage extends DevAction {
  public async execute(data: InternalApiInput<'deletePage'>): Promise<InternalApiResult<'deletePage'>> {
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    const fileReader = new FileReader(this.app.stage === Stage.development);
    const { key } = data;
    const appSchema = fileReader.readAppSchema();
    
    // Remove page directory or file
    fileWriter.removePage(key);
    this.app.loadPageConfigs();

    // Remove page ID from menuPageOrder if it exists
    if (appSchema.sidebar.menuPageOrder?.includes(key)) {
      const menuPageOrder = appSchema.sidebar.menuPageOrder.filter(pageKey => pageKey !== key);
      fileWriter.writeSidebarSchemaJsonFile({
        menuPageOrder,
      });
    }
  }
}