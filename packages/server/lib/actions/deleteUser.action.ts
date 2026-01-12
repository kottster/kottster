import { IdentityProviderUserPermission, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
import { NO_IDP_ERROR_MSG } from "../constants/errors";

/**
 * Delete the user
 */
export class DeleteUser extends Action {
  protected requiredPermissions = [IdentityProviderUserPermission.manage_users];

  public async execute({ userId }: InternalApiInput<'deleteUser'>): Promise<InternalApiResult<'deleteUser'>> {
    if (!this.app.identityProvider) {
      throw new Error(NO_IDP_ERROR_MSG);
    }
    
    await this.app.identityProvider.deleteUser(userId);
  }
}