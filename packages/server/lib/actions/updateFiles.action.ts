import { DSAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";
import { PageFileStructure } from "@kottster/common";

interface Data {
  page?: {
    createOrUpdate?: PageFileStructure;
  };
}

/**
 * Update files for pages and procedures
 */
export class UpdateFiles extends DSAction {
  public async execute(data: Data) {
    const { page } = data;

    const fileWriter = new FileWriter({ usingTsc: this.ds.usingTsc });
    
    if (page?.createOrUpdate) {
      fileWriter.writePageToFile(page.createOrUpdate);
    };

    return {};
  }
}