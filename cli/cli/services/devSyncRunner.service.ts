import { HttpFreePortFinder } from './httpFreePortFinder.service';
import { spawn } from 'child_process';
import { stripIndent } from '@kottster/common';

/**
 * Service to run dev-sync server
 */
export class DevSyncRunner {
  private readonly portRange = [5481, 6500];

  constructor(
    private readonly env: Record<string, string>
  ) {}

  /**
   * Run server
   * @returns The port the dev-sync server is running on
   */
  public async run(): Promise<number> {
    // Look for a free port
    const httpFreePortFinder = new HttpFreePortFinder(...this.portRange);
    const devSyncPort = await httpFreePortFinder.findFreePort();
    
    await spawn('node', [
      '--no-warnings',
      '--input-type=module',
      '-e',
      this.getExecutableCode()
    ], { 
      stdio: 'inherit',
      env: {
        ...this.env,
        PORT: devSyncPort.toString()
      }
    });

    return devSyncPort;
  }

  private getExecutableCode(): string {
    return stripIndent(`
      import { DevSync } from '@kottster/server';
      import { getEnvOrThrow } from '@kottster/common';
      const devSync = new DevSync({ appId: getEnvOrThrow('APP_ID') });
      devSync.start(getEnvOrThrow('PORT') ?? 5481);
    `);
  }
}

