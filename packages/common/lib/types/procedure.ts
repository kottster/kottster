import { IdentityProviderUser } from "../models/idp.model";

export type ProcedureName<T> = keyof T;

export type ProcedureInput<T, K extends ProcedureName<T>> =
  T[K] extends (...args: infer A) => any
    ? A extends [] ? undefined : A[0]
    : never;

export type ProcedureOutput<T, K extends ProcedureName<T>> =
  T[K] extends (...args: any[]) => any
    ? Awaited<ReturnType<T[K]>>
    : never;

export type Procedure = (input: any, ctx: ProcedureContext) => any;

export interface ProcedureContext {
  user: Pick<
    IdentityProviderUser,
    'id' | 'username' | 'email' | 'firstName' | 'lastName' | 'roleIds'
  >;
  req: any;
}
