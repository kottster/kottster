import { API } from '../services/api.service';
import { Nodemon } from '../services/nodemon.service';
import { AutoImport, checkTsUsage, getEnvOrThrow } from '@kottster/common';
import { Vite } from '../services/vite.service';
import { spawnSync } from 'child_process';

interface Options { 
  development?: boolean;
}

/**
 * Start the project in the current directory.
 */
export async function startProject (script: string, options: Options): Promise<void> {
  const NODE_ENV = options.development ? 'development' : 'production';
  const usingTsc = checkTsUsage();

  // Read config
  const appId = getEnvOrThrow('APP_ID');
  const secretKey = getEnvOrThrow('SECRET_KEY');
  
  // Get JWT secret using secret key
  const jwtSecret = API.getJWTSecret(appId, secretKey);

  // Generate files
  const autoImport = new AutoImport({ usingTsc });
  autoImport.createClientPagesFile();
  autoImport.createServerProceduresFile();

  // Run Vite
  const vite = new Vite(NODE_ENV);

  // Environment variables
  const env = {
    ...process.env,
    JWT_SECRET: jwtSecret,
    NODE_ENV,
  };

  if (NODE_ENV === 'production') {
    spawnSync('node', [
      '--no-warnings',
      '--experimental-specifier-resolution=node',
      script
    ], { 
      stdio: 'inherit',
      env
    });
  } else {
    const viteDevServerUrl = await vite.runDevServer();
    
    // Run nodemon
    const nodemon = new Nodemon(autoImport);
    nodemon.runWatcher(script, {
      ...env,
      VITE_DEV_SERVER_URL: viteDevServerUrl.toString()
    }); 
  };
}
