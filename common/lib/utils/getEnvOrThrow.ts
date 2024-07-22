/**
 * Get an environment variable or throw an error if it is not set.
 * @param key The key of the environment variable
 * @returns The value of the environment variable
 * @throws Error if the environment variable is not set
 */
export function getEnvOrThrow(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Environment variable ${key} is not set. Please set it in a .env file or pass it as a command line argument.`);
  }

  return value;
}
