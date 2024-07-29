import { AppContext } from './appContext.model';
import { File } from './file.model';

export interface ProcedureFileStructure {
  procedureName: string;

  // Entry file of the procedure
  // Example: src/server/procedures/getOrders.js
  entryFile: File;
}

export interface Procedure {
  procedureName: string;
}

export type ProcedureFunction = (params: { 
  args: Record<string, any>,
  ctx: AppContext,
}) => void;

export interface RegisteredProcedure extends Procedure {
  function: ProcedureFunction;
}
