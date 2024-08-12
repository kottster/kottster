import path from 'path'
import { build, createServer, loadConfigFromFile } from 'vite';

/**
 * Service to run vite build
 * Docs: https://vitejs.dev/config/
 */
export class Vite {
  constructor(
    private readonly NODE_ENV: string
  ) {}

  /**
   * Run Vite build
   */
  async run(): Promise<void> {
    try {
      // Resolve the config file
      const configFile = path.resolve('./vite.config.js');
      const buildMode = this.NODE_ENV === 'development' ? 'development' : 'production';

      // Load the Vite config
      const loadedConfig = await loadConfigFromFile({
        command: 'build',
        mode: buildMode,
      }, configFile);
      if (!loadedConfig) {
        throw new Error('Failed to load Vite config file');
      }

      // Rewrite the config mode
      loadedConfig.config.mode = buildMode;

      // Run the build
      await build(loadedConfig.config);
      
      console.log('Vite build completed successfully.');
    } catch(e) {
      console.error('Vite build error:', e);
    }
  }

  /**
   * Run Vite dev server
   * @returns The server URL
   */
  async runDevServer(): Promise<string> {
    try {
      // Resolve the config file
      const configFile = path.resolve('./vite.config.js');
      const serverMode = 'development';
  
      // Load the Vite config
      const loadedConfig = await loadConfigFromFile({
        command: 'serve',
        mode: serverMode,
      }, configFile);
      if (!loadedConfig) {
        throw new Error('Failed to load Vite config file');
      }
  
      // Rewrite the config mode
      loadedConfig.config.mode = serverMode;
  
      // Create the Vite server
      const server = await createServer(loadedConfig.config);
  
      // Start the server
      await server.listen();

      const port = server.config.server.port;

      if (!port) {
        throw new Error('Vite dev server port not found');
      }

      console.log(`Vite dev server is running on port ${port}`);

      return `http://localhost:${port}`;
    } catch(e) {
      throw new Error('Vite dev server error: ' + e);
    }
  }
}

