import { IdentityProviderUserPermission, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";

/**
 * Get users
 */
export class GetUsers extends Action {
  protected requiredPermissions = [IdentityProviderUserPermission.manage_users];
  
  public async execute(): Promise<InternalApiResult<'getUsers'>> {
    const users = await this.app.identityProvider.getUsers();
    
    return {
      users: users.map(u => this.app.identityProvider.prepareUserForClient(u)),
    }
  }
}