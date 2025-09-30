import { InternalApiResult } from "@kottster/common";
import { DevAction } from "../models/action.model";

/**
 * Get the project settings
 */
export class GetProjectSettings extends DevAction {
  public async execute(): Promise<InternalApiResult<'getProjectSettings'>> {
    return {
      usingTsc: this.app.usingTsc,
    };
  }
}