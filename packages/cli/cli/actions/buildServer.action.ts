import { build } from 'vite';
import path from 'path';
import fs from 'fs/promises';
import { checkTsUsage, readAppSchema } from '@kottster/common';

export async function buildServer(): Promise<void> {
  const usingTsc = checkTsUsage();
  const projectDir = process.cwd();
  const pagesDir = path.join(projectDir, 'app/pages');
  const dataSourcesDir = path.join(projectDir, 'app/_server/data-sources');

  // Find all app/pages/<pageKey>/page.json
  const pageJsonFiles: string[] = [];
  try {
    const dirs = await fs.readdir(pagesDir, { withFileTypes: true });
    
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const dirPath = path.join(pagesDir, dir.name);
        const files = await fs.readdir(dirPath);
        
        for (const file of files) {
          if (file === 'page.json') {
            pageJsonFiles.push(path.join(dirPath, file));
          }
        }
      }
    }
  } catch (error) {
    console.warn('Could not read pages directory:', error);
  }
  
  // Find all app/pages/<pageKey>/api.server.js or .ts files
  const filenameEnding = `.server.${usingTsc ? 'ts' : 'js'}`;
  const pageApiFiles: string[] = [];
  try {
    const dirs = await fs.readdir(pagesDir, { withFileTypes: true });
    
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const dirPath = path.join(pagesDir, dir.name);
        const files = await fs.readdir(dirPath);
        
        for (const file of files) {
          if (file.endsWith(filenameEnding)) {
            pageApiFiles.push(path.join(dirPath, file));
          }
        }
      }
    }
  } catch (error) {
    console.warn('Could not read pages directory:', error);
  }

  // Find all app/_server/data-sources/<dataSource>/dataSource.json
  const dataSourceJsonFiles: string[] = [];
  try {
    const dirs = await fs.readdir(dataSourcesDir, { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const dirPath = path.join(dataSourcesDir, dir.name);
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          if (file === 'dataSource.json') {
            dataSourceJsonFiles.push(path.join(dirPath, file));
          }
        }
      }
    }
  } catch (error) {
    console.warn('Could not read data sources directory:', error);
  }

  // Find all app/_server/data-sources/<dataSource>/index.js or .ts files
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
      pageApiFiles.map(file => [
        file.replace(path.join(projectDir, 'app/'), '').replace(filenameEnding, ''),
        file
      ])
    ),
    ...Object.fromEntries(
      dataSourceFiles.map(file => [
        file.replace(path.join(projectDir, 'app/_server/'), '').replace(`.${usingTsc ? 'ts' : 'js'}`, ''),
        file
      ])
    ),
  };

  try {
    const tsconfigFile = path.join(projectDir, 'tsconfig.json');
    const tsconfigContent = await fs.readFile(tsconfigFile, 'utf8');
    const tsconfig = JSON.parse(tsconfigContent) as any;
    const paths = tsconfig?.compilerOptions?.paths ?? {}

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
          ...paths,
          '@': '/app'
        }
      }
    });

    // Copy app/pages/<pageKey>/page.json files
    for (const file of pageJsonFiles) {
      const destPath = path.join(
        projectDir,
        'dist/server',
        path.relative(path.join(projectDir, 'app'), file)
      );
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(file, destPath);
    }

    // Copy app/_server/data-sources/<dataSource>/dataSource.json files
    for (const file of dataSourceJsonFiles) {
      const destPath = path.join(
        projectDir,
        'dist/server',
        path.relative(path.join(projectDir, 'app/_server'), file)
      );
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(file, destPath);
    }

    // Save dist/server/app-schema.json
    const appSchema = readAppSchema(projectDir, true);
    const schemasOutputPath = path.join(projectDir, 'dist/server/app-schema.json');
    await fs.writeFile(schemasOutputPath, JSON.stringify(appSchema, null, 2));

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}
