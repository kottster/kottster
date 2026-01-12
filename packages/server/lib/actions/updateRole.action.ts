import { IdentityProviderUserPermission, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
import { NO_IDP_ERROR_MSG } from "../constants/errors";

/**
 * Update the role
 */
export class UpdateRole extends Action {
  protected requiredPermissions = [IdentityProviderUserPermission.manage_users];

  public async execute({ roleId, role }: InternalApiInput<'updateRole'>): Promise<InternalApiResult<'updateRole'>> {
    if (!this.app.identityProvider) {
      throw new Error(NO_IDP_ERROR_MSG);
    }
    
    const updatedRole = await this.app.identityProvider.updateRole(roleId, role);

    // TODO: When name is changed, update all references in the app configuration

    return {
      role: updatedRole,
    }
  }
}