export interface User {
  id: string;
  email: string;
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

export interface JWTTokenPayload {
  stage: 'production' | 'development';
  appId: string;
  userId: string;
  userEmail: string;
}
