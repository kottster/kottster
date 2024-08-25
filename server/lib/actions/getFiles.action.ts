import { DSAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { PageFileStructure, ProcedureFileStructure } from "@kottster/common";

interface Data {
  pageId: string;
  includeProcedures?: boolean;
}

interface Result {
  page?: PageFileStructure | null;
  procedures?: ProcedureFileStructure[];
}

/**
 * Get the file structure of pages and procedures
 */
export class GetFiles extends DSAction {
  public async execute(data: Data): Promise<Result> {
    const { pageId, includeProcedures } = data;

    const fileReader = new FileReader();
    const pageStructure = pageId ? fileReader.getPageFileStructure(pageId) : null;
    const procedureStructures = includeProcedures ? fileReader.getProcedureFileStructures() : [];

    return {
      page: pageStructure,
      procedures: procedureStructures
    };
  }
}