import { AutoImport } from "@kottster/common";
import { DSAction } from "../models/action.model";
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
export class UpdatePage extends DSAction {
  public async execute(data: Data) {
    const { updatedPageId, page } = data;
    const fileWriter = new FileWriter({ usingTsc: this.ds.usingTsc });
    const autoImport = new AutoImport({ usingTsc: this.ds.usingTsc });
    
    if (updatedPageId !== page.pageId) {
      fileWriter.renamePageDirectory(updatedPageId, page.pageId);
      autoImport.createPageRoutersFile();
    }

    return {};
  }
}