import { IdentityProviderUserPermission, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";

/**
 * Delete the user
 */
export class DeleteUser extends Action {
  protected requiredPermissions = [IdentityProviderUserPermission.manage_users];

  public async execute({ userId }: InternalApiInput<'deleteUser'>): Promise<InternalApiResult<'deleteUser'>> {
    await this.app.identityProvider.deleteUser(userId);
  }
}