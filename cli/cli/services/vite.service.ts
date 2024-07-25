import path from 'path'
import fs from 'fs'
import * as esbuild from 'esbuild';
import { build, InlineConfig, loadConfigFromFile, resolveConfig } from 'vite';

/**
 * Service for running Vite build
 * Docs: https://vitejs.dev/config/
 */
export class Vite {
  // Relative path to the entry point
  private entryPoint: string;

  // Relative path to the output file
  private outfile: string;

  constructor(
    private readonly NODE_ENV: string
  ) {
    this.entryPoint = 'src/client/index.jsx';
    this.outfile = 'dist/static/bundle.js';
  }

  /**
   * Run Vite build
   */
  async run(): Promise<void> {
    if (!fs.existsSync(path.resolve(this.entryPoint))) {
      console.log(`The file ${this.entryPoint} does not exist. Skipping Vite build.`);
      return;
    }

    try {
      // Resolve the config file
      const configFile = path.resolve('./vite.config.js');
      
      // Load the Vite config
      const loadedConfig = await loadConfigFromFile({
        command: 'build',
        mode: this.NODE_ENV === 'development' ? 'development' : 'production',
      }, configFile);
      if (!loadedConfig) {
        throw new Error('Failed to load Vite config file');
      }

      // Run the build
      const result = await build(loadedConfig.config);
      
      console.log('Vite build completed successfully.');
    } catch(e) {
      console.error('Vite build error:', e);
    }
  }
}

