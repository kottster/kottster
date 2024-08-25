import { DSAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";
import { AutoImport } from "@kottster/common";

interface Data {
  pageId: string;
}

/**
 * Delete a page
 */
export class DeletePage extends DSAction {
  public async execute(data: Data) {
    const autoImport = new AutoImport({ usingTsc: this.ds.usingTsc });
    const fileWriter = new FileWriter({ usingTsc: this.ds.usingTsc });
    const { pageId } = data;

    autoImport.createClientPagesFile([pageId]);
    fileWriter.removePageDirectory(pageId);

    return null;
  }
}