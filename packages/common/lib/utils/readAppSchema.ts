import { AppSchema, MainJsonSchema, SidebarJsonSchema } from '../models/appSchema.model';
import path from 'path';
import fs from 'fs';

/**
 * Read and parse the kottster-app.json file in the current working directory.
 * @returns The parsed AppSchema object
 * @throws If the file does not exist or is not valid JSON
 */
export function readAppSchema(projectDir: string, isDevelopment: boolean): AppSchema {
  let schema: AppSchema;

  // In production, read from the compiled dist/server/app-schema.json
  if (!isDevelopment) {
    const unitedSchemaFilePath = path.join(projectDir, 'dist', 'server', 'app-schema.json');
    if (!fs.existsSync(unitedSchemaFilePath)) {
      throw new Error(`File not found: ${unitedSchemaFilePath}`);
    }
    const content = fs.readFileSync(unitedSchemaFilePath, 'utf8');
    schema = JSON.parse(content) as AppSchema;
    return schema;
  } else {
    const mainSchemaFilePath = path.join(projectDir, 'kottster-app.json');
    const sidebarSchemaFilePath = path.join(projectDir, 'app', 'schemas', 'sidebar.json');
      
    // Load kottster-app.json
    if (!fs.existsSync(mainSchemaFilePath)) {
      throw new Error(`File not found: ${mainSchemaFilePath}`);
    }
    const content = fs.readFileSync(mainSchemaFilePath, 'utf8');
    const main = JSON.parse(content) as MainJsonSchema;
    schema = { main, sidebar: {} };
  
    // Load app/schemas/sidebar.json
    if (fs.existsSync(sidebarSchemaFilePath)) {
      const sidebarContent = fs.readFileSync(sidebarSchemaFilePath, 'utf8');
      const sidebar = JSON.parse(sidebarContent) as SidebarJsonSchema;
      schema.sidebar = sidebar;
    }
  
    return schema;
  }
}