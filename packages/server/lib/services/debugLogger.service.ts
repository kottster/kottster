import { FileWriter } from "./fileWriter.service";

/**
 * Service for debugging 
 */
export class DebugLogger {
  private readonly DEBUG_MODE = process.env.DEBUG_MODE === 'true';

  constructor(private readonly name: string, private readonly data: Record<string, unknown> = {}) {}

  /**
   * Log a key-value pair
   */
  log(key: string, value: unknown): void {
    if (!this.DEBUG_MODE) {
      return;
    }

    this.data[key] = value;
  }

  /**
   * Write the debug info to a file
   */
  write(): void {
    if (!this.DEBUG_MODE) {
      return;
    }

    try {
      const fileWriter = new FileWriter({ usingTsc: false });  
      const serializedData = JSON.stringify(this.data, null, 2);
      fileWriter.writeDebugJsonFile(this.name, serializedData);
    } catch (error) {
      console.error('Failed to save debug info:', error);
    }
  }
}
