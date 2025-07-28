import { DevAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { PageFileStructure } from "@kottster/common";

interface Data {
  pageKey: string;
}

interface Result {
  page?: PageFileStructure | null;
}

/**
 * Get the file structure of pages and procedures
 */
export class GetFiles extends DevAction {
  public async executeDevAction(data: Data): Promise<Result> {
    const { pageKey } = data;

    const fileReader = new FileReader();
    const pageStructure = pageKey ? fileReader.getPageFileStructure(pageKey) : null;

    return {
      page: pageStructure,
    };
  }
}