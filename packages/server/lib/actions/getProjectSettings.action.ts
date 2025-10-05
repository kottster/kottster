import { InternalApiResult } from "@kottster/common";
import { DevAction } from "../models/action.model";

/**
 * Get the project settings
 */

// TODO: Get rid of this action, pass VITE_ env variables instead 
export class GetProjectSettings extends DevAction {
  public async execute(): Promise<InternalApiResult<'getProjectSettings'>> {
    return {
      usingTsc: this.app.usingTsc,
    };
  }
}