import nodemon from 'nodemon';
import { FileCreator } from './fileCreator.service';
import { ESBuild } from './esbuild.service';

export class Nodemon {
  constructor (
    private readonly fileCreator: FileCreator,
    private readonly esbuild: ESBuild
  ) {}
  
  public runWatcher(script: string, env: Record<string, string>) {
    nodemon({
      script,
      watch: [
        'src/client/pages',
        'src/server',
  
        // The schema.json is watched cause we need to restart the server when it changes
        'src/__generated__/schema.json',
      ],
      ignore: ['src/**/*.generated.js'],
      ext: 'js,jsx,json',
      execMap: {
        js: 'node --no-warnings --experimental-specifier-resolution=node',
      },
      env,
    })
      .on('restart', (files) => {
        // Check if any client or server files have changed
        const isClientFileChanged = files?.some((file: string) => file.includes('src/client/pages'));
        const isServerFileChanged = files?.some((file: string) => file.includes('src/server'));
  
        if (isClientFileChanged) {
          this.fileCreator.addClientPages();
          this.esbuild.run();
        }
        
        if (isServerFileChanged) {
          this.fileCreator.addServerProcedures();
        }
      })
      .on('crash', () => process.exit())
      .on('quit', () => process.exit());
  }
}