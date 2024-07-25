import { API } from '../services/api.service';
import { FileCreator } from '../services/fileCreator.service';
import { Nodemon } from '../services/nodemon.service';
import { getEnvOrThrow } from '@kottster/common';
import { Vite } from '../services/vite.service';

interface Options { 
  development?: boolean;
}

/**
 * Start the project in the current directory.
 */
export async function startProject (script: string, options: Options): Promise<void> {
  const projectDir = process.cwd();
  const NODE_ENV = options.development ? 'development' : 'production';
  
  // Read config
  const appId = getEnvOrThrow('APP_ID');
  const secretKey = getEnvOrThrow('SECRET_KEY');
  
  // Get JWT secret using secret key
  const jwtSecret = API.getJWTSecret(appId, secretKey);

  // Generate files
  const fileCreator = new FileCreator(appId, projectDir);
  fileCreator.addClientPages();
  fileCreator.addServerProcedures();

  // Run esbuild
  const vite = new Vite(NODE_ENV);
  await vite.run();
  
  // Run nodemon
  const nodemon = new Nodemon(fileCreator, vite);
  nodemon.runWatcher(script, {
    ...process.env,
    JWT_SECRET: jwtSecret,
    NODE_ENV
  }); 
}
