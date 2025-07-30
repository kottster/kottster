import { KottsterApp, KottsterAppOptions } from "../core/app";

const APP_SYMBOL = Symbol.for('kottster.app.instance');

/**
 * Create a new Kottster application
 * @param options The options for the application
 * @returns The app instance
 */
export function createApp(options: KottsterAppOptions): KottsterApp {
  const global = globalThis as any;
  
  // Initialize storage
  if (!global[APP_SYMBOL]) {
    global[APP_SYMBOL] = new Map<string, KottsterApp>();
  }
  
  const key = options.schema?.id;
  
  // Look for existing instance
  if (global[APP_SYMBOL].has(key)) {
    return global[APP_SYMBOL].get(key)!;
  }
  
  // Save new instance
  const app = new KottsterApp(options);
  global[APP_SYMBOL].set(key, app);
  
  return app;
}