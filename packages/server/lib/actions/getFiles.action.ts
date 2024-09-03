import { DSAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { PageFileStructure } from "@kottster/common";

interface Data {
  pageId: string;
}

interface Result {
  page?: PageFileStructure | null;
}

/**
 * Get the file structure of pages and procedures
 */
export class GetFiles extends DSAction {
  public async execute(data: Data): Promise<Result> {
    const { pageId } = data;

    const fileReader = new FileReader();
    const pageStructure = pageId ? fileReader.getPageFileStructure(pageId) : null;

    return {
      page: pageStructure,
    };
  }
}