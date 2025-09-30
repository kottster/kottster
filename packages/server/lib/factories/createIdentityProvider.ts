import { IdentityProvider, IdentityProviderOptions, IdentityProviderStrategyType } from "../core/identityProvider";

const IDP_SYMBOL = Symbol.for('kottster.idp.instance');

/**
 * Create a new identity provider
 * @param options The options for the identity provider
 * @returns The identity provider instance
 */
export function createIdentityProvider(key: keyof typeof IdentityProviderStrategyType, options: IdentityProviderOptions): IdentityProvider {
  const global = globalThis as any;
  
  // Initialize storage
  if (!global[IDP_SYMBOL]) {
    global[IDP_SYMBOL] = new Map<string, IdentityProvider>();
  }
  
  // Look for existing instance
  if (global[IDP_SYMBOL].has(key)) {
    return global[IDP_SYMBOL].get(key)!;
  }
  
  // Save new instance
  const idp = new IdentityProvider(options);
  global[IDP_SYMBOL].set(key, idp);

  return idp;
}