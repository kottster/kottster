export enum Role {
  USER = 'USER',
  DEVELOPER = 'DEVELOPER'
}

export interface User {
  id: string;
  email: string;
}

export interface JWTTokenPayload {
  id: string;
  appId: string;
  email: string;
  role: Role;
}
