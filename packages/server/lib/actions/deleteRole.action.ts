import { IdentityProviderUserPermission, InternalApiBody, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";

/**
 * Delete the role
 */
export class DeleteRole extends Action {
  protected requiredPermissions = [IdentityProviderUserPermission.manage_users];
  
  public async execute({ roleId }: InternalApiBody<'deleteRole'>): Promise<InternalApiResult<'deleteRole'>> {
    // TODO: Update all references in the app configuration

    await this.app.identityProvider.deleteRole(roleId);
  }
}