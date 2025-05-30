import { KottsterApp } from "../core/app";
import { KottsterServer } from "../core/server";

interface KottsterServerOptions {
  app: KottsterApp;
}

/**
 * Create a server
 * @param options - The options for the server including the app instance.
 */
export async function createServer(options: KottsterServerOptions) {
  const server = new KottsterServer(options);
  await server.start();
  return server;
}