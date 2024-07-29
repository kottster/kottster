import { User } from '@kottster/common';

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}