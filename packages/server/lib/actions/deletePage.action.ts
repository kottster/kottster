import { DevAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { FileWriter } from "../services/fileWriter.service";

interface Data {
  key: string;
}

/**
 * Delete a page
 */
export class DeletePage extends DevAction {
  public async executeDevAction(data: Data) {
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    const fileReader = new FileReader();
    const { key } = data;
    const appSchema = fileReader.readSchemaJsonFile();
    
    // Remove page directory or file
    fileWriter.removePage(key);

    // Remove page ID from menuPageOrder if it exists
    if (appSchema.menuPageOrder?.includes(key)) {
      appSchema.menuPageOrder = appSchema.menuPageOrder.filter(pageKey => pageKey !== key);
      fileWriter.writeSchemaJsonFile(appSchema);
    }
    
    return null;
  }
}