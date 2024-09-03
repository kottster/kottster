import { AppContext } from "@kottster/common";

/**
 * A function that extends the app context
 * @param ctx The app context
 * @returns The extended app context
 */
export type ExtendAppContextFunction = (ctx?: AppContext) => AppContext;
