import { KottsterApp, KottsterAppOptions } from "../core/app";

/**
 * Create a new Kottster application
 * @param options The options for the application
 * @returns The app instance
 */
export function createApp(options: KottsterAppOptions) {
  const app = new KottsterApp(options);

  return app;
}