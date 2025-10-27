import { AppSchema, ClientAppSchema } from "../models/appSchema.model";

/**
 * Check if the schema is empty
 * @param schema
 * @returns true if the schema is empty
 */
export function isAppSchemaEmpty(schema: AppSchema | ClientAppSchema | Record<string, never>): schema is Record<string, never> {
  return !(schema as AppSchema)?.main?.id;
}