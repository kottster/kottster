import { AppData } from "../models/appData.model";
import { User } from "../models/user.model";

export function checkUserForRoles(user: User | AppData['user'], roleIds: string[]) {
  const userRoleIds = ('roles' in user ? user.roles?.map(r => r.id) : user.roleIds) || [];

  return roleIds.some(rid => userRoleIds.includes(rid));
}