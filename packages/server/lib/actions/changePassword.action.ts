import { IdentityProviderUserWithRoles, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";

/**
 * Change the password of a current user
 */
export class ChangePassword extends Action {
  public async execute({ password, newPassword }: InternalApiInput<'changePassword'>, user: IdentityProviderUserWithRoles): Promise<InternalApiResult<'changePassword'>> {
    const isPasswordVerified = user.passwordHash && await this.app.identityProvider.verifyPassword(password, user.passwordHash);
    if (!isPasswordVerified) {
      throw new Error('Password is incorrect');
    }

    await this.app.identityProvider.updateUserPassword(user.id, newPassword);
  }
}