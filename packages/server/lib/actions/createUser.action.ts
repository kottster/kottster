import { generateRandomString, IdentityProviderUserPermission, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
import { NO_IDP_ERROR_MSG } from "../constants/errors";
import { prepareUserForClient } from "../utils/prepareUserForClient";

/**
 * Create a user
 */
export class CreateUser extends Action {
  protected requiredPermissions = [IdentityProviderUserPermission.manage_users];

  public async execute({ user, password }: InternalApiInput<'createUser'>): Promise<InternalApiResult<'createUser'>> {
    if (!this.app.identityProvider) {
      throw new Error(NO_IDP_ERROR_MSG);
    }
    
    const newUser = await this.app.identityProvider.createUser({
      ...user,
      jwtTokenCheck: generateRandomString(24),
    }, password);

    return {
      user: prepareUserForClient(newUser),
    }
  }
}