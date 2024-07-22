import { KottsterApp } from "../core/app";

/**
 * The base class for all actions
 * @abstract
 */
export abstract class Action {
  constructor(protected readonly app: KottsterApp) {}

  public abstract execute(data: unknown): Promise<unknown>;
}
