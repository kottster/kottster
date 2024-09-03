import { AutoImport } from "@kottster/common";
import { DSAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";

interface Data {
  pageId: string;
}

/**
 * Delete a page
 */
export class DeletePage extends DSAction {
  public async execute(data: Data) {
    const fileWriter = new FileWriter({ usingTsc: this.ds.usingTsc });
    const autoImport = new AutoImport({ usingTsc: this.ds.usingTsc });
    const { pageId } = data;

    fileWriter.removePageDirectory(pageId);
    autoImport.createPageRoutersFile();

    return null;
  }
}