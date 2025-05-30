import { build } from 'vite';
import path from 'path';
import fs from 'fs/promises';
import { checkTsUsage } from '@kottster/common';

export async function buildServer(): Promise<void> {
  const projectDir = process.cwd();
  const usingTsc = checkTsUsage();
  const filenameEnding = `.server.${usingTsc ? 'ts' : 'js'}`;

  // Find all server files in the app/pages directory
  const pagesDir = path.join(projectDir, 'app/pages');
  const serverFiles: string[] = [];
  try {
    const dirs = await fs.readdir(pagesDir, { withFileTypes: true });
    
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const dirPath = path.join(pagesDir, dir.name);
        const files = await fs.readdir(dirPath);
        
        for (const file of files) {
          if (file.endsWith(filenameEnding)) {
            serverFiles.push(path.join(dirPath, file));
          }
        }
      }
    }
  } catch (error) {
    console.warn('Could not read pages directory:', error);
  }
  
  const input = {
    server: `app/_server/server.${usingTsc ? 'ts' : 'js'}`,
    ...Object.fromEntries(
      serverFiles.map(file => [
        file.replace(path.join(projectDir, 'app/'), '').replace(filenameEnding, ''),
        file
      ])
    )
  };

  try {
    await build({
      configFile: false,
      build: {
        ssr: true,
        outDir: 'dist/server',
        emptyOutDir: true,
        rollupOptions: {
          input,
          output: {
            format: 'cjs',
            entryFileNames: '[name].cjs'
          }
        }
      },
      resolve: {
        alias: {
          '@': '/app'
        }
      }
    })
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}