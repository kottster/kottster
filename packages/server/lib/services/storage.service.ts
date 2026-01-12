import { randomUUID } from "crypto";

const STORAGE_SYMBOL = Symbol.for('kottster.storage.instance');

class StorageService {
  private storage = new Map<string, any>();
  
  save(value: any): string {
    const key = randomUUID();
    this.storage.set(key, value);
    return key;
  }

  extract(key: string): any {
    if (this.storage.has(key)) {
      const value = this.storage.get(key);
      this.storage.delete(key);
      return value;
    } else {
      return undefined;
    }
  }
}

function getStorageService(): StorageService {
  const global = globalThis as any;
  
  if (!global[STORAGE_SYMBOL]) {
    global[STORAGE_SYMBOL] = new StorageService();
  }
  
  return global[STORAGE_SYMBOL];
}

export const storageService = getStorageService();