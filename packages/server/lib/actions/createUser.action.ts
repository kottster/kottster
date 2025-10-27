import { generateRandomString, IdentityProviderUserPermission, InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
/**
 * Create a user
 */
export class CreateUser extends Action {
  protected requiredPermissions = [IdentityProviderUserPermission.manage_users];

  public async execute({ user, password }: InternalApiInput<'createUser'>): Promise<InternalApiResult<'createUser'>> {
    const newUser = await this.app.identityProvider.createUser({
      ...user,
      jwtTokenCheck: generateRandomString(24),
    }, password);

    return {
      user: this.app.identityProvider.prepareUserForClient(newUser),
    }
  }
}