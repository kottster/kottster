import { DevAction } from "../models/action.model";

interface Result {
  usingTsc: boolean;
}

/**
 * Get the project settings
 */
export class GetProjectSettings extends DevAction {
  public async executeDevAction(): Promise<Result> {
    return {
      usingTsc: this.app.usingTsc,
    };
  }
}