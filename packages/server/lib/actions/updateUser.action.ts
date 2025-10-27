import { IdentityProviderUserPermission, IdentityProviderUserWithRoles, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";

/**
 * Update the user
 */
export class UpdateUser extends Action {
  public async execute({ userId, user, newPassword }: InternalApiInput<'updateUser'>, currentUser: IdentityProviderUserWithRoles): Promise<InternalApiResult<'updateUser'>> {
    const hasPermission = await this.app.identityProvider.userHasPermissions(currentUser.id, [IdentityProviderUserPermission.manage_users]);
    if (!hasPermission && currentUser.id !== userId) {
      throw new Error("You don't have permission to update this user");
    }

    const updatedUser = await this.app.identityProvider.updateUser(userId, user);
    if (newPassword) {
      await this.app.identityProvider.updateUserPassword(userId, newPassword);
    }

    return {
      user: this.app.identityProvider.prepareUserForClient(updatedUser),
    }
  }
}