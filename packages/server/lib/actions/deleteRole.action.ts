import { IdentityProviderUserPermission, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
import { NO_IDP_ERROR_MSG } from "../constants/errors";

/**
 * Delete the role
 */
export class DeleteRole extends Action {
  protected requiredPermissions = [IdentityProviderUserPermission.manage_users];
  
  public async execute({ roleId }: InternalApiInput<'deleteRole'>): Promise<InternalApiResult<'deleteRole'>> {
    if (!this.app.identityProvider) {
      throw new Error(NO_IDP_ERROR_MSG);
    }
    
    // TODO: Update all references in the app configuration
    await this.app.identityProvider.deleteRole(roleId);
  }
}