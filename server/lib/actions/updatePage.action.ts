import { Action } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";

interface Data {
  updatedPageId: string;
  page: {
    pageId: string;
  };
}

/**
 * Update a page
 */
export class UpdatePage extends Action {
  public async execute(data: Data) {
    const { updatedPageId, page } = data;
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    
    if (updatedPageId !== page.pageId) {
      fileWriter.renamePageDirectory(updatedPageId, page.pageId);
    }

    return {};
  }
}