import { Action } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";

interface Data {
  pageId: string;
}

/**
 * Create a new page
 */
export class CreatePage extends Action {
  public async execute(data: Data) {
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    const { pageId } = data;

    fileWriter.createNewEmptyPage(pageId);

    return null;
  }
}