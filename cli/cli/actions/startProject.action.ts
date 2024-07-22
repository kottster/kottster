import { API } from '../services/api.service';
import { FileCreator } from '../services/fileCreator.service';
import { ESBuild } from '../services/esbuild.service';
import { Nodemon } from '../services/nodemon.service';
import { getEnvOrThrow } from '@kottster/common';

interface Options { 
  production?: boolean;
}

/**
 * Start the project in the current directory.
 */
export async function startProject (script: string, options: Options): Promise<void> {
  const projectDir = process.cwd();
  const NODE_ENV = options.production ? 'production' : 'development';
  
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
  const esbuild = new ESBuild(NODE_ENV);
  await esbuild.run();
  
  // Run nodemon
  const nodemon = new Nodemon(fileCreator, esbuild);
  nodemon.runWatcher(script, {
    ...process.env,
    JWT_SECRET: jwtSecret,
    NODE_ENV
  }); 
}
