import fs from "fs";
import path from "path";
import { PROJECT_DIR } from "../constants/projectDir";

/**
 * Service for caching files
 */
export class CachingService {
  private readonly cacheKey = process.env.CACHE_KEY;

  getCacheFilePath(slug: string): string {
    return path.join(PROJECT_DIR, '.cache', `${slug}_${this.cacheKey}.json`);
  }

  saveValueToCache(slug: string, value: Record<string, any>): void {
    const cacheFilePath = this.getCacheFilePath(slug);
    const cacheDir = path.dirname(cacheFilePath);

    // Ensure the cache directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Write the value to the cache file
    fs.writeFileSync(cacheFilePath, JSON.stringify(value, null, 2), 'utf8');
  }

  readValueFromCache(slug: string): Record<string, any> | null {
    const cacheFilePath = this.getCacheFilePath(slug);

    // Check if the cache file exists
    if (fs.existsSync(cacheFilePath)) {
      const data = fs.readFileSync(cacheFilePath, 'utf8');
      return JSON.parse(data);
    }

    // Return null if the cache file does not exist
    return null;
  }
}
