import { IdentityProviderUserPermission, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";

/**
 * Update the role
 */
export class UpdateRole extends Action {
  protected requiredPermissions = [IdentityProviderUserPermission.manage_users];

  public async execute({ roleId, role }: InternalApiInput<'updateRole'>): Promise<InternalApiResult<'updateRole'>> {
    const updatedRole = await this.app.identityProvider.updateRole(roleId, role);

    // TODO: When name is changed, update all references in the app configuration

    return {
      role: this.app.identityProvider.prepareRoleForClient(updatedRole),
    }
  }
}