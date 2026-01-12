import { IdentityProviderUserPermission, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
import { NO_IDP_ERROR_MSG } from "../constants/errors";

/**
 * Create a role
 */
export class CreateRole extends Action {
  protected requiredPermissions = [IdentityProviderUserPermission.manage_users];

  public async execute({ role }: InternalApiInput<'createRole'>): Promise<InternalApiResult<'createRole'>> {
    if (!this.app.identityProvider) {
      throw new Error(NO_IDP_ERROR_MSG);
    }
    
    const newRole = await this.app.identityProvider.createRole(role);
    
    return {
      role: newRole,
    }
  }
}