import { IdentityProviderUser } from "@kottster/common";
import { Request } from "express";

export type Procedure = (input: any, ctx: ProcedureContext) => any;

export type ProcedureContext = {
  [key: string]: any;

  user: IdentityProviderUser;

  req: Request;
};

/**
 * A function that extends the procedure context
 * @param ctx The procedure context
 * @returns The extended procedure context
 */
export type ExtendProcedureContextFunction = (ctx?: ProcedureContext) => ProcedureContext;

