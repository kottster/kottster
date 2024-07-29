import nodemon from 'nodemon';
import { FileCreator } from './fileCreator.service';
import { Vite } from './vite.service';

/**
 * Service to run nodemon
 */
export class Nodemon {
  constructor (
    private readonly fileCreator: FileCreator,
    private readonly vite: Vite
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
          this.fileCreator.addClientPages();
          await this.vite.run();
        }
        
        if (isServerFileChanged) {
          this.fileCreator.addServerProcedures();
        }
      })
      .on('crash', () => process.exit())
      .on('quit', () => process.exit());
  }
}