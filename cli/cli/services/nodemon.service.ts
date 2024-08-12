import nodemon from 'nodemon';
import { AutoImport } from '@kottster/common';

/**
 * Service to run nodemon
 */
export class Nodemon {
  constructor (
    private readonly autoImport: AutoImport
  ) {}
  
  public runWatcher(script: string, env: Record<string, string>) {
    nodemon({
      script,
      watch: [
        'src/client',
        'src/server',
  
        // The schema.json is watched cause we need to restart the server when it changes
        'src/__generated__/schema.json',
      ],
      ignore: ['src/**/*.generated.js', 'src/**/*.generated.ts'],
      ext: '*',
      execMap: {
        js: 'node --no-warnings --experimental-specifier-resolution=node',
      },
      env,
    })
      .on('restart', async (files) => {
        // Check if any client or server files have changed
        const isClientFileChanged = files?.some((file: string) => file.includes('src/client'));
        const isServerFileChanged = files?.some((file: string) => file.includes('src/server'));
  
        if (isClientFileChanged) {
          this.autoImport.createClientPagesFile();
        }
        
        if (isServerFileChanged) {
          this.autoImport.createServerProceduresFile();
        }
      })
      .on('crash', () => process.exit())
      .on('quit', () => process.exit());
  }
}