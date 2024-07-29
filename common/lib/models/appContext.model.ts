import { Stage } from "./stage.model";
import { User } from "./user.model";

export type AppContext = {
  [key: string]: any;
  stage: Stage;
  user: User;
};

export type ExtendAppContextFunction = (ctx?: AppContext) => AppContext;
