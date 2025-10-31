import { ErrorCode } from "../models/errorCode.model";
import { ProcedureError } from "./procedureError";

export class ValidationError extends ProcedureError {
  constructor(
    message: string,
    public field?: string,
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.validationError, context);
    this.name = 'ValidationError';
  }
}