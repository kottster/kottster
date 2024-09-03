import http from 'http';

/**
 * Service to find a free port in the specified range
 */
export class HttpFreePortFinder {
  private startPort: number;
  private endPort: number;

  constructor(startPort: number = 3000, endPort: number = 65535) {
    this.startPort = startPort;
    this.endPort = endPort;
  }

  public findFreePort(): Promise<number> {
    return this.testPort(this.startPort);
  }

  private testPort(port: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = http.createServer();
      server.listen(port, () => {
        server.close(() => {
          resolve(port);
        });
      });
      server.on('error', () => {
        if (port < this.endPort) {
          this.testPort(port + 1).then(resolve, reject);
        } else {
          reject(new Error('No free ports available in the specified range'));
        }
      });
    });
  }
}