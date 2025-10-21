import { IdentityProviderUserPermission, IdentityProviderUserWithRoles, Stage } from "@kottster/common";
import { KottsterApp } from "../core/app";
import { Request } from "express";

/**
 * The base class for actions
 * @abstract
 */
export abstract class Action {
  constructor(protected readonly app: KottsterApp) {}

  protected requiredPermissions: (keyof typeof IdentityProviderUserPermission)[] = [];

  public async executeWithCheckings(data: unknown, user?: IdentityProviderUserWithRoles, req?: Request): Promise<unknown> {
    // Ensure that user has the required permissions
    if (this.requiredPermissions.length > 0) {
      if (!user) {
        throw new Error("This action requires authentication.");
      }

      for (const permission of this.requiredPermissions) {
        const hasPermission = await this.app.identityProvider.userHasPermissions(user.id, [permission]);

        if (!hasPermission) {
          throw new Error(`This action requires the '${permission}' permission.`);
        }
      }
    }

    return this.execute(data, user, req);
  };

  protected abstract execute(data: unknown, user?: IdentityProviderUserWithRoles, req?: Request): Promise<unknown>;
}

/**
 * The base class for developer actions
 * @abstract
 */
export abstract class DevAction {
  constructor(protected readonly app: KottsterApp) {}

  public executeWithCheckings(data: unknown): Promise<unknown> {
    // Ensure that the action can only be executed in development stage
    if (this.app.stage !== Stage.development) {
      throw new Error("This action can only be executed in development stage.");
    }

    return this.execute(data);
  };
  
  protected abstract execute(data: unknown): Promise<unknown>;
}
