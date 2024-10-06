import { HttpFreePortFinder } from './httpFreePortFinder.service';
import { ChildProcess, spawn } from 'child_process';
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
   * @returns The port and the http server process
   */
  public async run(): Promise<[number, ChildProcess]> {
    // Look for a free port
    const httpFreePortFinder = new HttpFreePortFinder(...this.portRange);
    const devSyncPort = await httpFreePortFinder.findFreePort();
    
    // Run the executable code
    const process = spawn('node', [
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

    return [devSyncPort, process];
  }

  private getExecutableCode(): string {
    return stripIndent(`
      import { DevSync } from '@kottster/server';
      import { getEnvOrThrow } from '@kottster/common';
      const devSync = new DevSync();
      devSync.start(getEnvOrThrow('PORT') ?? 5481);
    `);
  }
}

