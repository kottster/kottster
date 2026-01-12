import { IdentityProviderUserPermission, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
import { NO_IDP_ERROR_MSG } from "../constants/errors";
import { prepareUserForClient } from "../utils/prepareUserForClient";

/**
 * Get users
 */
export class GetUsers extends Action {
  protected requiredPermissions = [IdentityProviderUserPermission.manage_users];
  
  public async execute(): Promise<InternalApiResult<'getUsers'>> {
    if (!this.app.identityProvider) {
      throw new Error(NO_IDP_ERROR_MSG);
    }

    const users = await this.app.identityProvider.getUsers();
    
    return {
      users: users.map(u => prepareUserForClient(u)),
    }
  }
}