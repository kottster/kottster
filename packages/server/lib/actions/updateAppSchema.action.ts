import { AppSchema } from "@kottster/common";
import { DevAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { FileWriter } from "../services/fileWriter.service";

interface Data {
  menuPageOrder?: AppSchema['menuPageOrder'];
}

/**
 * Update the app schema with the provided data.
 */
export class UpdateAppSchema extends DevAction {
  public async executeDevAction(data: Data) {
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    const fileReader = new FileReader();
    const { menuPageOrder } = data;
    const appSchema = fileReader.readSchemaJsonFile();

    // Update data in the app schema
    if (menuPageOrder) {
      appSchema.menuPageOrder = menuPageOrder;
    }

    // Update pages in the app schema
    fileWriter.writeSchemaJsonFile(appSchema);

    return {};
  }
}