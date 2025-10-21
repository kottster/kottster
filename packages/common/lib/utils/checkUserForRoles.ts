import { ROOT_USER_ID } from "../constants/idp";
import { ClientIdentityProviderRole, ClientIdentityProviderUser, IdentityProviderRole, IdentityProviderUser, User } from "../models/idp.model";

type UnifiedUser = IdentityProviderUser | ClientIdentityProviderUser | User | ClientIdentityProviderUser;

type UnifiedRole = IdentityProviderRole | ClientIdentityProviderRole;

/**
 * Checks if the user has at least one of the specified roles.
 * @description Role IDs properties have been replaced with role names. This function supports both for backward compatibility.
 */
export function checkUserForRoles(
  userId: UnifiedUser['id'], 
  userRoles: UnifiedRole[],
  roles?: string[],
  roleIds?: string[]
) {
  // If no user is provided, deny access
  if (!userId) {
    return false;
  }

  // It's assumed that the root user has all roles
  if (userId === ROOT_USER_ID) {
    return true;
  }

  // If no roles or roleIds are specified, allow access
  if ((!roles || roles.length === 0) && (!roleIds || roleIds.length === 0)) {
    return true;
  }  
  
  // TODO: Remove in v4 - only keep role names
  // Get user role IDs (for backward compatibility)
  const userRoleIds = userRoles.map(r => r.id).map(v => v.toString());
  
  // Get user role names
  const userRoleNames = userRoles.map(r => r.name).filter(n => n) as string[];

  return roles?.some(n => userRoleNames.includes(n)) || roleIds?.some(rid => userRoleIds.includes(rid.toString()));
}