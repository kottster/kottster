import { InternalApiInput, InternalApiResult, SidebarJsonSchema, Stage } from "@kottster/common";
import { DevAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { FileWriter } from "../services/fileWriter.service";

/**
 * Create a new empty page
 */
export class CreatePage extends DevAction {
  public async execute(data: InternalApiInput<'createPage'>): Promise<InternalApiResult<'createPage'>> {
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    const fileReader = new FileReader(this.app.stage === Stage.development);
    const appSchema = fileReader.readAppSchema();

    // Add page file
    if (data.file) {
      fileWriter.writePageToFile(data.file);
    }
    this.app.loadPageConfigs();

    // Add page to menuPageOrder
    if (!appSchema.sidebar.menuPageOrder?.includes(data.key)) {
      const menuPageOrder: SidebarJsonSchema['menuPageOrder'] = [
        ...appSchema.sidebar.menuPageOrder ?? [],
        data.key,
      ];
      fileWriter.writeSidebarSchemaJsonFile({
        menuPageOrder,
      });
    }
  }
}