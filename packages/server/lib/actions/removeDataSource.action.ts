import { DevAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";

interface Data {
  name: string;
}

/**
 * Verify and add data source to the project
 */
export class RemoveDataSource extends DevAction {
  public async executeDevAction(data: Data) {
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });

    fileWriter.removeDataSource(data.name);

    return {};
  }
}