import { DSAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";
import { PageFileStructure } from "@kottster/common";

interface Data {
  createOrUpdatePages?: PageFileStructure[];
}

/**
 * Update files for pages and procedures
 * @deprecated Use createPage/updatePage instead
 */
export class UpdateFiles extends DSAction {
  public async execute(data: Data) {
    const fileWriter = new FileWriter({ usingTsc: this.ds.usingTsc });

    if (data?.createOrUpdatePages) {
      data.createOrUpdatePages.forEach(page => {
        fileWriter.writePageToFile(page);
      });
    }

    return {};
  }
}