import { Action } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";
import { AutoImport } from "@kottster/common";

interface Data {
  pageId: string;
}

/**
 * Delete a page
 */
export class DeletePage extends Action {
  public async execute(data: Data) {
    const autoImport = new AutoImport({ usingTsc: this.app.usingTsc });
    const fileWriter = new FileWriter({ usingTsc: this.app.usingTsc });
    const { pageId } = data;

    autoImport.createClientPagesFile([pageId]);
    fileWriter.removePageDirectory(pageId);

    return null;
  }
}