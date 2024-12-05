interface NewProjectCommandOptions {
  packageManager?: string;
  usingTypescript?: boolean;
}

/**
 * Service for calling the Kottster API.
 */
export class KottsterAPI {
  public static get API_BASE_URL() {
    return 'https://api.kottster.app';
  }

  /**
   * Send usage data to the server when a new project is created using "@kottster/cli new".
   * Usage data includes only the following information:
   * - App ID
   * - Command stage (start, finish, error)
   * - Current date and time
   * - Platform (Windows, macOS, Linux)
   * - Node.js version
   * - Command duration (for 'finish' stage)
   * - Package manager used (npm, yarn, pnpm, etc.)
   * - Whether TypeScript is used
   * 
   * @param stage - The stage of the command ('start', 'finish', or 'error')
   * @param startTime - The timestamp when the command started (for 'finish' stage)
   */
  static async sendNewProjectCommandUsageData(
    stage: 'start' | 'finish' | 'error',
    options?: NewProjectCommandOptions,
    startTime?: number, // Optional, only required for 'finish' stage,
  ) {
    const dateTime = new Date().toISOString();
    const platform = process.platform;
    const nodeVersion = process.version;

    let duration: number | undefined;
    if (stage === 'finish' && startTime) {
      // Calculate the command duration in milliseconds
      duration = Date.now() - startTime;
    }

    try {
      await fetch(`${this.API_BASE_URL}/v1/apps/cli-usage-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'new',
          stage,
          dateTime,
          platform,
          nodeVersion,
          duration,
          packageManager: options?.packageManager,
          usingTypescript: options?.usingTypescript,
        }),
      });
    } catch (error) {
      // eslint-disable-next-line no-empty
    }
  }
}