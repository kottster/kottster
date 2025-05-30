export type ProcedureName<T> = keyof T;

export type ProcedureInput<T, K extends ProcedureName<T>> = 
  T[K] extends (input: infer P) => any 
    ? P extends undefined ? undefined : P
    : T[K] extends () => any 
      ? undefined 
      : never;

export type ProcedureOutput<T, K extends ProcedureName<T>> = 
  T[K] extends (input: any) => infer R ? Awaited<R> : never;