import { AppSchema } from '../models/appSchema.model';
import path from 'path';
import fs from 'fs';

/**
 * Read and parse the kottster-app.json file in the current working directory.
 * @returns The parsed AppSchema object
 * @throws If the file does not exist or is not valid JSON
 */
export function readAppSchema(): AppSchema {
  const schemaPath = path.join(process.cwd(), 'kottster-app.json');
  if (!fs.existsSync(schemaPath)) {
    throw new Error('kottster-app.json not found. Please make sure you are in the project root directory.');
  }

  const rawSchema = fs.readFileSync(schemaPath, 'utf-8');
  try {
    const schema = JSON.parse(rawSchema);
    return schema;
  } catch (error) {
    throw new Error('Failed to parse kottster-app.json. Please make sure it is a valid JSON file.');
  }
}