import { InternalApiResult, Stage } from "@kottster/common";
import { DevAction } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";

/**
 * Get the project settings
 */
export class GetProjectSettings extends DevAction {
  public async execute(): Promise<InternalApiResult<'getProjectSettings'>> {
    const fileReader = new FileReader(this.app.stage === Stage.development);
    
    // TODO: remove?
    const { pagesWithDefinedIndexJsxFile, pagesWithDefinedApiServerJsFile } = await fileReader.checkFilesForPages();

    return {
      usingTsc: this.app.usingTsc,
      pagesWithDefinedIndexJsxFile,
      pagesWithDefinedApiServerJsFile,
    };
  }
}