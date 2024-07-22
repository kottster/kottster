export type AppContext = Record<string, any>;

export type ExtendAppContextFunction = (ctx?: AppContext) => AppContext;
