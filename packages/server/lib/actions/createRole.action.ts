import { IdentityProviderUserPermission, InternalApiBody, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";

/**
 * Create a role
 */
export class CreateRole extends Action {
  protected requiredPermissions = [IdentityProviderUserPermission.manage_users];

  public async execute({ role }: InternalApiBody<'createRole'>): Promise<InternalApiResult<'createRole'>> {
    const newRole = await this.app.identityProvider.createRole(role);
    
    return {
      role: this.app.identityProvider.prepareRoleForClient(newRole),
    }
  }
}