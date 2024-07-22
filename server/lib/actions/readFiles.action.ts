import { Action } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { PageStructure, ProcedureStructure } from "@kottster/common";

interface Data {
  pageId: string;
}

interface Result {
  page: PageStructure;
  procedures: ProcedureStructure[];
}

/**
 * Read files
 */
export class ReadFiles extends Action {
  public async execute(data: Data): Promise<Result> {
    const { pageId } = data;

    const fileReader = new FileReader();

    const pageStructure = fileReader.getPageStructure(pageId);
    const procedureStructures = fileReader.getProcedureStructures();

    return {
      page: pageStructure,
      procedures: procedureStructures
    };
  }
}