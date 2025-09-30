import { ROOT_USER_ID } from "../constants/idp";
import { ClientIdentityProviderUser, IdentityProviderUser, User } from "../models/idp.model";

export function checkUserForRoles(user: IdentityProviderUser | ClientIdentityProviderUser | User | ClientIdentityProviderUser, roleIds: string[]) {
  if (!user) {
    return false;
  }

  // It's assumed that the root user has all roles
  if (user.id === ROOT_USER_ID) {
    return true;
  }
  
  const userRoleIds = (('roles' in user ? user.roles?.map(r => r.id) : user.roleIds) || []).map(v => v.toString());
  return roleIds.some(rid => userRoleIds.includes(rid.toString()));
}