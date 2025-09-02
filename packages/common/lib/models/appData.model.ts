import { User } from "./user.model";

enum Permission {
  manage_users = 'manage_users',
  manage_settings = 'manage_settings',
  develop_app = 'develop_app'
}

interface AppDataUser extends Pick<User, 'id' | 'email' | 'firstName' | 'avatarUrl'> {
  roleIds: string[];
  permissions: (keyof typeof Permission)[];
  
  /**
   * @deprecated Use `roleIds` instead
   */
  roleId?: string;

  /**
   * @deprecated Use `roleIds` instead
   */
  role?: string;
}

export interface AppData {
  app: {
    id: string;
    roles: {
      id: string;
      name: string;
    }[];
  };
  user: AppDataUser;
  resources?: {
    videoTutorialUrl?: string;
    discordInviteUrl?: string;
  };
  needUpdate?: {
    critical: boolean;
    learnMoreUrl: string;
  };
}