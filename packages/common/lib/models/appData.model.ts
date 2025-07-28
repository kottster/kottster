export interface AppData {
  app: {
    id: string | number;
    roles: {
      id: number;
      name: string;
    }[];
  };
  user: {
    id: string | number;
    email: string;
    avatarUrl?: string;
    firstName: string;
    
    roleId: string | number;
    
    permissions: ('manage_users' | 'manage_settings' | 'develop_app')[];

    // Legacy properties
    role: string;
  };
  stage: 'development' | 'production';
  resources?: {
    videoTutorialUrl?: string;
    discordInviteUrl?: string;
  };
  needUpdate?: {
    critical: boolean;
    learnMoreUrl: string;
  };
}