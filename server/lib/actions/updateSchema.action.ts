import { Action } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";
import { FileReader } from "../services/fileReader.service";
import { FullAppSchema } from "@kottster/common";

interface Data extends FullAppSchema {}

/**
 * Update the app schema
 * @description Updates the schema.json file and creates/removes pages as needed.
 */
export class UpdateSchema extends Action {
  public async execute(data: Data) {
    const { version, pages } = data;
    
    const fileWriter = new FileWriter();
    const fileReader = new FileReader();

    fileWriter.writeSchemaJsonFile({
      version,
      pages,
    });

    // Add pages that exist only in the new schema
    pages.map(page => {
      fileWriter.createNewEmptyPage(page.id);
    });

    // Remove pages that exist only as files
    const existingPageDirectories = fileReader.getPagesDirectories();
    existingPageDirectories.map(page => {
      if (!pages.find(p => p.id === page)) {
        fileWriter.removePageDirectory(page);
      }
    });

    return {};
  }
}