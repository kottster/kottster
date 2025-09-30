import { AppSchema, KottsterApiBody, KottsterApiResult, Stage } from "@kottster/common";
import { KottsterApp } from "../core/app";

export class KottsterApi {
  enterpriseHub: AppSchema['enterpriseHub'];

  get JWT_TOKEN() {
    return '';
  }

  get API_BASE_URL() {
    return process.env.KOTTSTER_API_BASE_URL ?? 'https://api.kottster.app';
  }

  handleUnauthorized() {
    throw new Error('Kottster API returned 401 Unauthorized. Please check your Kottster API token in the config.');
  }

  async generateSql(appId: string, apiToken: string, body: KottsterApiBody<'generateSql'>): Promise<KottsterApiResult<'generateSql'> | null> {
    const url = this.enterpriseHub ? `${this.enterpriseHub.url}/v1/apps/${appId}/sql-generation` : `${this.API_BASE_URL}/v3/apps/${appId}/sql-generation`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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

  async getKottsterContext(app: KottsterApp, apiToken: string): Promise<KottsterApiResult<'getKottsterContext'> | null> {
    const url = this.enterpriseHub ? `${this.enterpriseHub.url}/v1/apps/${app.appId}/context` : `${this.API_BASE_URL}/v3/apps/${app.appId}/context`;

    // TODO: pass the version here
    const response = await fetch(`${url}?dev=${app.stage === Stage.development ? 'true' : ''}`, {
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