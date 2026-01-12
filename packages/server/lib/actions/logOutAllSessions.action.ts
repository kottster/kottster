import { IdentityProviderUserWithRoles, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
import { NO_IDP_ERROR_MSG } from "../constants/errors";

/**
 * Log out all sessions of a current user
 */
export class LogOutAllSessions extends Action {
  public async execute({ password }: InternalApiInput<'logOutAllSessions'>, user: IdentityProviderUserWithRoles): Promise<InternalApiResult<'logOutAllSessions'>> {
    if (!this.app.identityProvider) {
      throw new Error(NO_IDP_ERROR_MSG);
    }
    
    const isPasswordVerified = user.passwordHash && await this.app.identityProvider.verifyPassword(password, user.passwordHash);
    if (!isPasswordVerified) {
      throw new Error('Current password is incorrect');
    }

    await this.app.identityProvider.invalidateAllSessions(user.id);
  }
}