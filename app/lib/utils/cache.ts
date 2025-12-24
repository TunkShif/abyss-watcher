/**
 * Options for the cached utility function.
 */
interface CachedOptions {
  /** The Cloudflare KV namespace to use for storage. */
  kv: KVNamespace;
  /** The unique key to store/retrieve the cached value. */
  key: string;
  /** Optional absolute expiration time in seconds since the UNIX epoch. */
  expiration?: number;
  /** Optional relative expiration time in seconds from now. */
  expirationTtl?: number;
  /** If true, bypasses the cache and always executes the function. */
  noCache: boolean;
}

/**
 * Converts minutes to seconds.
 * @param n - Number of minutes.
 * @returns Number of seconds.
 */
export const minutes = (n: number) => n * 60;

/**
 * Converts hours to seconds.
 * @param n - Number of hours.
 * @returns Number of seconds.
 */
export const hours = (n: number) => n * minutes(60);

/**
 * Converts days to seconds.
 * @param n - Number of days.
 * @returns Number of seconds.
 */
export const days = (n: number) => n * hours(24);

/**
 * Wraps a function with caching logic using Cloudflare KV.
 *
 * If a value is found in the cache and `noCache` is false, it returns the cached value.
 * Otherwise, it executes the function, stores the result in KV, and returns it.
 *
 * @template T - The type of the value being cached.
 * @param fn - The asynchronous function to execute if the cache is missed.
 * @param options - Configuration for the cache behavior.
 * @returns The result of the function, either from cache or fresh execution.
 */
export const cached = async <T>(
  fn: () => Promise<T>,
  { kv, key, expiration, expirationTtl, noCache }: CachedOptions,
): Promise<T> => {
  if (!noCache) {
    const maybeValue = await kv.get<T>(key, "json");
    if (maybeValue !== null) return maybeValue;
  }
  const value = await fn();
  await kv.put(key, JSON.stringify(value), {
    expiration,
    expirationTtl,
  });
  return value;
};
