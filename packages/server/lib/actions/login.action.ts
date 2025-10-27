import { IdentityProviderUser, IdentityProviderUserWithRoles, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
import { Request } from "express";

/**
 * Login into an account
 */
export class Login extends Action {
  public async execute({ usernameOrEmail, password, newPassword }: InternalApiInput<'login'>, _: IdentityProviderUserWithRoles, req?: Request): Promise<InternalApiResult<'login'>> {
    const rootUser = this.app.identityProvider.getRootUserByUsername(usernameOrEmail);
    const ipAddress = this.getClientIp(req);

    // Fake await to mitigate timing attacks
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get recent failed attempts
    const recentFailedAttempts = await this.app.identityProvider.getRecentFailedAttempts(
      usernameOrEmail,
      ipAddress,
      5
    );
    if (recentFailedAttempts >= 10) {
      throw new Error('Too many failed sign-in attempts. Please try again later in 5 minutes.');
    }

    try {
      if (rootUser) {
        await this.app.identityProvider.authenticateRootUser(usernameOrEmail, password);
        const userJwtToken = await this.app.identityProvider.generateTokenForRootUser();
        
        await this.recordSuccessfulLogin(usernameOrEmail, undefined, req);
  
        return {
          userJwtToken,
        };
      } else {
        const user = await this.app.identityProvider.authenticateUser(usernameOrEmail, password);
        if (user.temporaryPassword) {
          if (newPassword) {
            // If new password is provided, set it instead of the temporary password
            await this.app.identityProvider.updateUserPassword(user.id, newPassword, false);
          } else {
            return {
              needsNewPassword: true,
            }
          }
        }

        await this.app.identityProvider.updateUser(user.id, { lastLoginAt: new Date() });
        await this.recordSuccessfulLogin(usernameOrEmail, user.id, req);
        
        const userJwtToken = await this.app.identityProvider.generateToken(user.id);
        return {
          userJwtToken,
        };
      }
    } catch(e) {
      await this.recordFailedLogin(usernameOrEmail, e instanceof Error ? e.message : undefined, req);

      throw e;
    }
  }

  private async recordSuccessfulLogin(identifier: string, userId?: IdentityProviderUser['id'], req?: Request) {
    const ipAddress = this.getClientIp(req);
    const userAgent = this.getBrowserUserAgent(req);

    await this.app.identityProvider.recordLoginAttempt({
      identifier,
      ipAddress,
      userId,
      success: true,
      userAgent,
    });
  }

  private async recordFailedLogin(identifier: string, reason?: string, req?: Request) {
    const ipAddress = this.getClientIp(req);
    const userAgent = this.getBrowserUserAgent(req);

    await this.app.identityProvider.recordLoginAttempt({
      identifier,
      ipAddress,
      success: false,
      failureReason: reason,
      userAgent,
    });
  }

  private getBrowserUserAgent(req?: Request): string {
    return req?.headers['user-agent'] || '';
  }

  private getClientIp(req?: Request): string {
    const forwarded = req?.headers['x-forwarded-for'];
    
    if (Array.isArray(forwarded)) {
      return forwarded[0];
    }
    
    return req?.ip || forwarded || '';
  }
}