import { IdentityProviderUserPermission, InternalApiBody, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";

/**
 * Update the role
 */
export class UpdateRole extends Action {
  protected requiredPermissions = [IdentityProviderUserPermission.manage_users];

  public async execute({ roleId, role }: InternalApiBody<'updateRole'>): Promise<InternalApiResult<'updateRole'>> {
    const updatedRole = await this.app.identityProvider.updateRole(roleId, role);

    return {
      role: this.app.identityProvider.prepareRoleForClient(updatedRole),
    }
  }
}