import { ClientIdentityProviderUser, IdentityProviderUserPermission, IdentityProviderUserWithRoles, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
import { NO_IDP_ERROR_MSG } from "../constants/errors";
import { prepareUserForClient } from "../utils/prepareUserForClient";

/**
 * Update the user
 */
export class UpdateUser extends Action {
  public async execute(
    { userId, user, newPassword }: InternalApiInput<'updateUser'>,
    currentUser: IdentityProviderUserWithRoles
  ): Promise<InternalApiResult<'updateUser'>> {
    if (!this.app.identityProvider) {
      throw new Error(NO_IDP_ERROR_MSG);
    }

    const isSelfUpdate = currentUser.id === userId;

    if (isSelfUpdate) {
      return this.updateCurrentUser(userId, user);
    }

    return this.updateOtherUser(currentUser.id, userId, user, newPassword);
  }

  private async updateCurrentUser(
    userId: ClientIdentityProviderUser['id'],
    user: Partial<ClientIdentityProviderUser>
  ): Promise<InternalApiResult<'updateUser'>> {
    const updatedUser = await this.app.identityProvider!.updateUserNonSensitiveFields(userId, user);
    return this.prepareResponse(updatedUser);
  }

  private async updateOtherUser(
    currentUserId: ClientIdentityProviderUser['id'],
    targetUserId: ClientIdentityProviderUser['id'],
    user: Partial<ClientIdentityProviderUser>,
    newPassword?: string
  ): Promise<InternalApiResult<'updateUser'>> {
    const hasPermission = await this.app.identityProvider!.userHasPermissions(
      currentUserId,
      [IdentityProviderUserPermission.manage_users]
    );
    if (!hasPermission) {
      throw new Error("You don't have permission to update this user");
    }

    const updatedUser = await this.app.identityProvider!.updateUser(targetUserId, user);
    if (newPassword) {
      await this.app.identityProvider!.updateUserPassword(targetUserId, newPassword);
    }

    return this.prepareResponse(updatedUser);
  }

  private prepareResponse(updatedUser: any): InternalApiResult<'updateUser'> {
    return {
      user: prepareUserForClient(updatedUser),
    };
  }
}