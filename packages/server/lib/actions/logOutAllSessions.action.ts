import { IdentityProviderUser, InternalApiBody, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";

/**
 * Log out all sessions of a current user
 */
export class LogOutAllSessions extends Action {
  public async execute({ password }: InternalApiBody<'logOutAllSessions'>, user: IdentityProviderUser): Promise<InternalApiResult<'logOutAllSessions'>> {
    const isPasswordVerified = user.passwordHash && await this.app.identityProvider.verifyPassword(password, user.passwordHash);
    if (!isPasswordVerified) {
      throw new Error('Current password is incorrect');
    }

    await this.app.identityProvider.invalidateAllSessions(user.id);
  }
}