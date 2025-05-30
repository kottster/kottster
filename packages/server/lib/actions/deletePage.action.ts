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
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    const fileReader = new FileReader();
    const { id } = data;
    const appSchema = fileReader.readSchemaJsonFile();
    
    // Remove nav item from app schema
    appSchema.navItems = appSchema.navItems.filter(item => item.id !== id);
    fileWriter.writeSchemaJsonFile(appSchema);
    
    // Remove page directory or file
    fileWriter.removePage(id);
    
    return null;
  }
}