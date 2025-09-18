import { Page, Stage } from "@kottster/common";
import { DevAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { FileWriter } from "../services/fileWriter.service";

interface Data {
  key: string;
  page: Partial<Page>;
}

/**
 * Update a page
 */
export class UpdatePage extends DevAction {
  public async executeDevAction(data: Data) {
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    const fileReader = new FileReader(this.app.stage === Stage.development);
    const { key, page } = data;
    const appSchema = fileReader.readSchemaJsonFile();

    // Update page config
    fileWriter.updatePageConfig(key, {
      ...page,
    } as Page);

    // Update page file if key has changed
    if (page.key && key !== page.key) {
      fileWriter.renamePage(key, page.key);

      // Update page key in menuPageOrder if it exists
      if (appSchema.menuPageOrder?.includes(key)) {
        appSchema.menuPageOrder = appSchema.menuPageOrder.map((pageKey) => (pageKey === key ? page.key! : pageKey));
        fileWriter.writeSchemaJsonFile(appSchema);
      }
    }

    return {};
  }
}