import { DSAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { FileWriter } from "../services/fileWriter.service";

interface Data {
  id: string;
}

/**
 * Delete a page
 */
export class DeletePage extends DSAction {
  public async execute(data: Data) {
    const fileWriter = new FileWriter({ usingTsc: this.ds.usingTsc });
    const fileReader = new FileReader();
    const { id } = data;
    const appSchema = fileReader.readSchemaJsonFile();
    
    // Remove nav item from app schema
    appSchema.navItems = appSchema.navItems.filter(item => item.id !== id);
    fileWriter.writeSchemaJsonFile(appSchema);
    
    // Timeout to avoid making multiple changes at the same time
    setTimeout(() => {
      // Remove page directory or file
      fileWriter.removePage(id);
    }, 400);

    return null;
  }
}