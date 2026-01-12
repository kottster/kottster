import { ClientIdentityProviderUser, ClientIdentityProviderUserWithRoles, IdentityProviderUser, IdentityProviderUserWithRoles } from "@kottster/common";

/**
 * Prepare a user object for sending to the client by removing sensitive fields
 * @param user - The user object to prepare
 * @returns The prepared user object
 */
export function prepareUserForClient<T extends IdentityProviderUser | IdentityProviderUserWithRoles>(
  user: T
): T extends IdentityProviderUserWithRoles 
  ? ClientIdentityProviderUserWithRoles 
  : ClientIdentityProviderUser {
  const sanitized = { ...user };
  
  sanitized.passwordHash = '';
  sanitized.twoFactorSecret = undefined;
  sanitized.jwtTokenCheck = undefined;

  if ('roles' in sanitized && Array.isArray(sanitized.roles)) {
    sanitized.roles = sanitized.roles.map(role => role);
  }

  return sanitized as any;
}