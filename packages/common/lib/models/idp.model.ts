export enum IdentityProviderUserPermission {
  manage_users = 'manage_users',
  manage_settings = 'manage_settings',
}

export interface IdentityProviderUser {
  id: number | string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roleIds?: (number | string)[];
  passwordHash?: string;
  avatarUrl?: string;
  temporaryPassword?: boolean;
  passwordResetToken?: string;
  twoFactorSecret?: string;
  lastLoginAt?: Date | string;
  jwtTokenCheck?: string;
  settings?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ClientIdentityProviderUser extends Omit<
  IdentityProviderUser, 
  'passwordHash' | 'passwordResetToken' | 'twoFactorSecret' | 'jwtTokenSecret'
> {}

export interface IdentityProviderRole {
  id: number | string;
  name?: string;
  permissions?: (keyof typeof IdentityProviderUserPermission)[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ClientIdentityProviderRole extends IdentityProviderRole {}

export interface IdentityProviderLoginAttempt {
  id: number | string;
  ipAddress: string;
  identifier: string;
  userId?: number | string;
  success: boolean;
  failureReason?: string;
  userAgent?: string;
  attemptedAt: Date | string;
}

/** @deprecated */
export interface User {
  id: number;
  
  username?: string;
  email?: string;

  firstName?: string;
  avatarUrl?: string;
  roles: {
    id: string;
    name: string;
  }[];

  /**
   * @deprecated Use `roles` instead
   */
  role?: {
    id: string;
    name: string;
  };
}

/** @deprecated */
export interface JWTTokenPayload {
  stage: 'production' | 'development';
  appId: string;
  userId: string;
  userEmail: string;
}
