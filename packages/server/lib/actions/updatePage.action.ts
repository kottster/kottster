import { DSAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { FileWriter } from "../services/fileWriter.service";

interface Data {
  id: string;
  page: {
    name?: string;
    id: string;
  };
}

/**
 * Update a page
 */
export class UpdatePage extends DSAction {
  public async execute(data: Data) {
    const fileWriter = new FileWriter({ usingTsc: this.ds.usingTsc });
    const fileReader = new FileReader();
    const { id, page } = data;
    const appSchema = fileReader.readSchemaJsonFile();

    // Update nav item in app schema
    appSchema.navItems = appSchema.navItems.map(p => {
      if (p.id === id) {
        return {
          ...p,
          id: page.id,
          name: page.name || page.id
        }
      }

      return p;
    });
    
    // Remove page directory or file
    fileWriter.renamePage(id, page.id);
    
    if (id !== page.id) {
      // Timeout to avoid making multiple changes at the same time
      setTimeout(() => {
        fileWriter.writeSchemaJsonFile(appSchema);
      }, 400);
    }

    return {};
  }
}