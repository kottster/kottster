import fetch from 'sync-fetch';

/**
 * Service for calling the Kottster API.
 */
export class API {
  static readonly API_BASE_URL = process.env.KOTTSTER_API_BASE_URL ?? 'https://api.kottster.app';

  /**
   * Generate a new JWT secret for the given app ID and secret key.
   * @description The previous JWT secret will be invalidated.
   * @param appId The app ID
   * @param secretKey The API secret key
   */
  static getJWTSecret(appId: string, secretKey: string): string {
    const url = `${this.API_BASE_URL}/apps/${appId}/jwt-secret?secretKey=${encodeURIComponent(secretKey)}`;

    try {
      const res = fetch(url);
      const data = res.json();

      if (res.status !== 200) {
        throw new Error(data?.message);
      }

      return data.jwtSecret;
    } catch (error) {
      throw new Error('Failed to get JWT secret: ' + error);
    }
  }
}