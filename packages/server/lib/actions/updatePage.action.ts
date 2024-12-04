import { DSAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";

interface Data {
  pageId: string;
  page: {
    pageId: string;
  };
}

/**
 * Update a page
 */
export class UpdatePage extends DSAction {
  public async execute(data: Data) {
    const { pageId, page } = data;
    const fileWriter = new FileWriter({ usingTsc: this.ds.usingTsc });
    
    if (pageId !== page.pageId) {
      fileWriter.renamePage(pageId, page.pageId);
    }

    return {};
  }
}