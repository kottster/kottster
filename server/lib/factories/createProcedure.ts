import { ProcedureFunction } from "@kottster/common";

/**
 * Create a procedure
 * @description This exists for type safety and future extensibility
 * @param procedure The procedure function
 * @returns The procedure function
 */
export function createProcedure(func: ProcedureFunction): ProcedureFunction {
  return func;
}
