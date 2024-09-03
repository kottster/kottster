export interface User {
  id: string;
  email: string;
}

export interface JWTTokenPayload {
  appId: string;
  userId: string;
  userEmail: string;
}
