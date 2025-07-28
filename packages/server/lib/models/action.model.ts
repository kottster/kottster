import { Stage } from "@kottster/common";
import { KottsterApp } from "../core/app";

/**
 * The base class for actions
 * @abstract
 */
export abstract class Action {
  constructor(protected readonly app: KottsterApp) {}

  public abstract execute(data: unknown): Promise<unknown>;
}

/**
 * The base class for developer actions
 * @abstract
 */
export abstract class DevAction {
  constructor(protected readonly app: KottsterApp) {}

  public execute(data: unknown): Promise<unknown> {
    // Ensure that the action can only be executed in development stage
    if (this.app.stage !== Stage.development) {
      throw new Error("This action can only be executed in development stage.");
    }

    return this.executeDevAction(data);
  };
  
  public abstract executeDevAction(data: unknown): Promise<unknown>;
}
