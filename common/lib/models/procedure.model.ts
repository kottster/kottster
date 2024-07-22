export interface ProcedureStructure {
  procedureName: string;
  file: {
    fileContent: string;
    fileName: string; 
    filePath: string;
  };
}

export interface Procedure {
  procedureName: string;
}

export interface RegisteredProcedure extends Procedure {
  function: unknown;
}
