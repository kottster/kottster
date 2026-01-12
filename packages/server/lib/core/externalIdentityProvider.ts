import { IdentityProviderUserWithRoles } from '@kottster/common';

export enum ExternalIdentityProviderType {
  keycloak = 'keycloak',
}

interface Operations {
  getLoginUrl: {
    input: {
      redirectUri: string;
    };
    output: {
      redirectUri: string;
    };
  };
  exchangeCodeForToken: {
    input: {
      code: string;
      stateSearchParam: string;
    };
    output: {
      accessToken: string;
      state?: Record<string, any>;
    };
  };
  getUserData: {
    input: {
      accessToken: string;
    };
    output: {
      user: IdentityProviderUserWithRoles;
    };
  };
  getClientRoles: {
    input?: {};
    output: {
      roles: {
        id: string;
        name?: string;
      }[];
    };
  };
}

export type ExternalIdentityProviderInput<T extends keyof Operations> =
  Operations[T]['input'];
export type ExternalIdentityProviderOutput<T extends keyof Operations> =
  Operations[T]['output'];

export abstract class ExternalIdentityProvider {
  public external = true;
  public abstract packageVersion: string;

  type: ExternalIdentityProviderType;

  abstract getKey(): string;

  abstract getLoginUrl(
    input: ExternalIdentityProviderInput<'getLoginUrl'>,
  ): Promise<ExternalIdentityProviderOutput<'getLoginUrl'>>;

  abstract exchangeCodeForToken(
    input: ExternalIdentityProviderInput<'exchangeCodeForToken'>,
  ): Promise<ExternalIdentityProviderOutput<'exchangeCodeForToken'>>;

  abstract getUserData(
    input: ExternalIdentityProviderInput<'getUserData'>,
  ): Promise<ExternalIdentityProviderOutput<'getUserData'>>;

  abstract getClientRoles(
    input: ExternalIdentityProviderInput<'getClientRoles'>,
  ): Promise<ExternalIdentityProviderOutput<'getClientRoles'>>;
}
