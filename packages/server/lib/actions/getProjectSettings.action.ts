import { DSAction } from "../models/action.model";

interface Result {
  usingTsc: boolean;
}

/**
 * Get the project settings
 */
export class GetProjectSettings extends DSAction {
  public async execute(): Promise<Result> {
    return {
      usingTsc: this.app.usingTsc,
    };
  }
}