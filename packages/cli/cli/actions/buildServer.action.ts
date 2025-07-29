import { build } from 'vite';
import path from 'path';
import fs from 'fs/promises';
import { checkTsUsage } from '@kottster/common';

export async function buildServer(): Promise<void> {
  const projectDir = process.cwd();
  const usingTsc = checkTsUsage();
  
  // Find all api.server.js files in the app/pages directory
  const filenameEnding = `.server.${usingTsc ? 'ts' : 'js'}`;
  const pagesDir = path.join(projectDir, 'app/pages');
  const apiFiles: string[] = [];
  try {
    const dirs = await fs.readdir(pagesDir, { withFileTypes: true });
    
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const dirPath = path.join(pagesDir, dir.name);
        const files = await fs.readdir(dirPath);
        
        for (const file of files) {
          if (file.endsWith(filenameEnding)) {
            apiFiles.push(path.join(dirPath, file));
          }
        }
      }
    }
  } catch (error) {
    console.warn('Could not read pages directory:', error);
  }

  // Find all data source files in the app/_server/data-sources directory
  const dataSourcesDir = path.join(projectDir, 'app/_server/data-sources');
  const dataSourceFiles: string[] = [];
  try {
    const dirs = await fs.readdir(dataSourcesDir, { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const dirPath = path.join(dataSourcesDir, dir.name);
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          if (file === 'index.js' || file === 'index.ts') {
            dataSourceFiles.push(path.join(dirPath, file));
          }
        }
      }
    }
  } catch (error) {
    console.warn('Could not read data sources directory:', error);
  }

  const input = {
    server: `app/_server/server.${usingTsc ? 'ts' : 'js'}`,
    ...Object.fromEntries(
      apiFiles.map(file => [
        file.replace(path.join(projectDir, 'app/'), '').replace(filenameEnding, ''),
        file
      ])
    ),
    ...Object.fromEntries(
      dataSourceFiles.map(file => [
        file.replace(path.join(projectDir, 'app/_server/'), '').replace(`.${usingTsc ? 'ts' : 'js'}`, ''),
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