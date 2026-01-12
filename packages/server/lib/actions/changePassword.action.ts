import { IdentityProviderUserWithRoles, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
import { NO_IDP_ERROR_MSG } from "../constants/errors";

/**
 * Change the password for the current user
 */
export class ChangePassword extends Action {
  public async execute({ password, newPassword }: InternalApiInput<'changePassword'>, user: IdentityProviderUserWithRoles): Promise<InternalApiResult<'changePassword'>> {
    if (!this.app.identityProvider) {
      throw new Error(NO_IDP_ERROR_MSG);
    }
    
    const isPasswordVerified = user.passwordHash && await this.app.identityProvider.verifyPassword(password, user.passwordHash);
    if (!isPasswordVerified) {
      throw new Error('Password is incorrect');
    }

    await this.app.identityProvider.updateUserPassword(user.id, newPassword);
  }
}