import path from 'path'
import fs from 'fs'
import { build, loadConfigFromFile } from 'vite';

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
    this.removeDistFolder();

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
   * Remove the dist folder
   */
  private removeDistFolder() {
    const distPath = path.resolve('dist');
    if (fs.existsSync(distPath)) {
      fs.rmdirSync(distPath, { recursive: true });
    }
  }
}

