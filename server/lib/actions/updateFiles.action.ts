import { Action } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";
import { PageFileStructure, ProcedureFileStructure } from "@kottster/common";

interface Data {
  pages?: PageFileStructure[];
  procedures?: ProcedureFileStructure[];
}

/**
 * Update files for pages and procedures
 */
export class UpdateFiles extends Action {
  public async execute(data: Data) {
    const { pages, procedures } = data;

    const fileWriter = new FileWriter();
    
    if (pages) {
      pages.forEach((page) => {
        fileWriter.writePageToFile(page);
      });
    };

    if (procedures) {
      fileWriter.writeProceduresToFile(procedures);
    };

    return {};
  }
}