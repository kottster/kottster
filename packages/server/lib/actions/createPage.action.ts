import { DSAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";

interface Data {
  pageId: string;
}

/**
 * Create a new empty page
 */
export class CreatePage extends DSAction {
  public async execute(data: Data) {
    const fileWriter = new FileWriter({ usingTsc: this.ds.usingTsc });
    const { pageId } = data;

    fileWriter.createNewEmptyPage(pageId);

    return null;
  }
}