import { Action } from "../models/action.model";
import { CodeWriter } from "../services/codeWriter.service";
import { PageStructure, ProcedureStructure } from "@kottster/common";

interface Data {
  page?: PageStructure;
  procedures?: ProcedureStructure[];
}

/**
 * Write files
 */
export class WriteFiles extends Action {
  public async execute(data: Data) {
    const { page, procedures } = data;

    const codeWriter = new CodeWriter();
    
    if (page) {
      codeWriter.writePageToFile(page);
    };

    console.log('procedures 0001', procedures);
    if (procedures) {
      codeWriter.writeProceduresToFile(procedures);
    };

    return {};
  }
}