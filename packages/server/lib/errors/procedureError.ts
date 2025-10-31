export class ProcedureError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ProcedureError';
    Error.captureStackTrace?.(this, ProcedureError);
  }
}