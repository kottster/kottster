import { KottsterApp } from "../core/app";
import { DevSync } from "../core/devSync";

/**
 * The base class for actions
 * @abstract
 */
export abstract class Action {
  constructor(protected readonly app: KottsterApp) {}

  public abstract execute(data: unknown): Promise<unknown>;
}

/**
 * The base class for dev-sync actions
 * @abstract
 */
export abstract class DSAction {
  constructor(protected readonly ds: DevSync) {}

  public abstract execute(data: unknown): Promise<unknown>;
}
