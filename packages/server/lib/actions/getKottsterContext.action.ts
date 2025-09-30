import { InternalApiResult } from "@kottster/common";
import { Action } from "../models/action.model";
import { KottsterApi } from "../services/kottsterApi.service";

const emptyResult: InternalApiResult<'getKottsterContext'> = {
  imposedLimits: {},
};

/**
 * Get the information about the current Kottster version, and what limits are in place for the current app instance.
 */
export class GetKottsterContext extends Action {
  public async execute(): Promise<InternalApiResult<'getKottsterContext'>> {
    const kottsterApi = new KottsterApi();
    const kottsterApiToken = this.app.getKottsterApiToken();
    if (!kottsterApiToken) {
      return emptyResult;
    }

    try {
      const data = await kottsterApi.getKottsterContext(this.app, kottsterApiToken);
  
      return {
        imposedLimits: data?.imposedLimits ?? {},
        availableUpdate: data?.availableUpdate
      }
    } catch(e) {
      console.warn('Failed to fetch Kottster context:', e);
    }

    return emptyResult;
  }
}