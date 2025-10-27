import { AppSchema, IdentityProviderUser, KottsterApiInput, KottsterApiResult, Stage } from "@kottster/common";
import { KottsterApp } from "../core/app";
import { VERSION } from "../version";
import crypto from 'crypto';

export class KottsterApi {
  enterpriseHub: AppSchema['main']['enterpriseHub'];

  get JWT_TOKEN() {
    return '';
  }

  get API_BASE_URL() {
    return process.env.KOTTSTER_API_BASE_URL ?? 'https://api.kottster.app';
  }

  handleUnauthorized() {
    throw new Error('Kottster API returned 401 Unauthorized. Please check your Kottster API token in the config.');
  }

  async generateSql(app: KottsterApp, body: Omit<KottsterApiInput<'generateSql'>, 'anonymousId'>): Promise<KottsterApiResult<'generateSql'> | null> {
    const apiToken = app.getKottsterApiToken();
    if (!apiToken) {
      throw new Error('Kottster API token is not set in the app config.');
    }
    const url = this.enterpriseHub ? `${this.enterpriseHub.url}/v1/apps/${app.appId}/sql-generation` : `${this.API_BASE_URL}/v3/apps/${app.appId}/sql-generation`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
      }),
    });
    if (response.status === 401) {
      this.handleUnauthorized();
      return null;
    }
    if (response.status !== 200) {
      throw new Error(await response.text());
    }

    return await response.json() as KottsterApiResult<'generateSql'>;
  }

  private getAnonymousId(...args: (string | number)[]) {
    const data = args.join('-');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async getKottsterContext(app: KottsterApp, user: IdentityProviderUser): Promise<KottsterApiResult<'getKottsterContext'> | null> {
    const apiToken = app.getKottsterApiToken();
    if (!apiToken) {
      throw new Error('Kottster API token is required to fetch app context. Please set it in the config.');
    }
    const anonymousId = this.getAnonymousId(apiToken, app.stage, user.id);
    const url = this.enterpriseHub ? `${this.enterpriseHub.url}/v1/apps/${app.appId}/context` : `${this.API_BASE_URL}/v3/apps/${app.appId}/context`;

    const response = await fetch(`${url}?ver=${VERSION}&dev=${app.stage === Stage.development ? 'true' : ''}&anonymousId=${anonymousId}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (response.status === 401) {
      this.handleUnauthorized();
      return null;
    }
    if (response.status !== 200) {
      throw new Error(await response.text());
    }

    return await response.json() as KottsterApiResult<'getKottsterContext'>;
  }

  async createApp(): Promise<KottsterApiResult<'createApp'> | null> {
    const url = this.enterpriseHub ? `${this.enterpriseHub.url}/v1/apps` : `${this.API_BASE_URL}/v3/apps`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.status === 401) {
      this.handleUnauthorized();
      return null;
    }
    if (response.status !== 200) {
      throw new Error(await response.text());
    }

    return await response.json() as KottsterApiResult<'createApp'>;
  }
}