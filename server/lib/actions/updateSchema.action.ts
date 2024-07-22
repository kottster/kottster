import { Action } from "../models/action.model";
import { CodeWriter } from "../services/codeWriter.service";
import { FileReader } from "../services/fileReader.service";
import { FullAppSchema } from "@kottster/common";

interface Data extends FullAppSchema {}

/**
 * Update the schema of the app
 */
export class UpdateSchema extends Action {
  public async execute(data: Data) {
    const { version, pages } = data;
    
    const codeWriter = new CodeWriter();
    const fileReader = new FileReader();

    codeWriter.writeSchemaJsonFile({
      version,
      pages,
    });

    // Add pages that exist only in the new schema
    pages.map(page => {
      codeWriter.createNewEmptyPage(page.id);
    });

    // Remove pages that exist only as files
    const existingPageDirectories = fileReader.getPagesDirectories();
    existingPageDirectories.map(page => {
      if (!pages.find(p => p.id === page)) {
        codeWriter.removePageDirectory(page);
      }
    });

    return {};
  }
}