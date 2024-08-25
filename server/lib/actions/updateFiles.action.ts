import { DSAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";
import { PageFileStructure, ProcedureFileStructure } from "@kottster/common";

interface Data {
  page?: {
    createOrUpdate?: PageFileStructure;
    delete?: PageFileStructure;
  };
  procedures?: {
    createOrUpdate?: ProcedureFileStructure[];
    delete?: ProcedureFileStructure[];
  };
}

/**
 * Update files for pages and procedures
 */
export class UpdateFiles extends DSAction {
  public async execute(data: Data) {
    const { page, procedures } = data;

    const fileWriter = new FileWriter({ usingTsc: this.ds.usingTsc });
    
    if (page?.createOrUpdate) {
      fileWriter.writePageToFile(page.createOrUpdate);
    };

    if (page?.delete) {
      fileWriter.deletePageDirectory(page.delete);
    }

    if (procedures?.createOrUpdate) {
      fileWriter.writeProceduresToFile(procedures.createOrUpdate);
    };

    if (procedures?.delete) {
      fileWriter.deleteProcedureFiles(procedures.delete);
    }

    return {};
  }
}