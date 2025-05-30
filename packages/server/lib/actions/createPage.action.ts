import { PageFileStructure } from "@kottster/common";
import { DSAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { FileWriter } from "../services/fileWriter.service";

interface Data {
  id: string;
  name?: string;
  file: PageFileStructure;
}

/**
 * Create a new empty page
 */
export class CreatePage extends DSAction {
  public async execute(data: Data) {
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    const fileReader = new FileReader();
    const { id, name } = data;
    const appSchema = fileReader.readSchemaJsonFile();

    fileWriter.writePageToFile(data.file);

    // Add new nav item to app schema
    appSchema.navItems.push({
      id: id,
      name: name || id,
      icon: 'file',
    });
    fileWriter.writeSchemaJsonFile(appSchema);

    return null;
  }
}