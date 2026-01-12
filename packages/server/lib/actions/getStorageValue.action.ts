import { InternalApiInput, InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
import { storageService } from "../services/storage.service";

/**
 * Get a value from the storage by its key
 */
export class GetStorageValue extends Action {
  public async execute({ key }: InternalApiInput<'getStorageValue'>): Promise<InternalApiResult<'getStorageValue'>> {
    const value = storageService.extract(key);
    return value;
  }
}