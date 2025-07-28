export interface User {
  id: string;
  email: string;
  role: {
    id: string;
    name: string;
  }
}

export interface JWTTokenPayload {
  stage: 'production' | 'development';
  appId: string;
  userId: string;
  userEmail: string;
}
