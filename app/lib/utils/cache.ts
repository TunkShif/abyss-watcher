import { Cache } from "~/lib/cache";

/**
 * Options for the cached utility function.
 */
interface CachedOptions {
  /** The unique key to store/retrieve the cached value. */
  key: string;
  /** Optional relative expiration time in seconds from now. */
  expire?: number;
  /** If true, bypasses the cache and always executes the function. */
  refresh?: boolean;
}

/**
 * Wraps a function with caching logic using Redis-based cache.
 *
 * If a value is found in the cache and `refresh` is false, it returns the cached value.
 * Otherwise, it executes the function, stores the result in cache, and returns it.
 *
 * @template T - The type of the value being cached.
 * @param fn - The asynchronous function to execute if the cache is missed.
 * @param options - Configuration for the cache behavior.
 * @returns The result of the function, either from cache or fresh execution.
 */
export const cached = async <T>(fn: () => Promise<T>, { key, expire, refresh = false }: CachedOptions): Promise<T> => {
  if (!refresh) {
    const cached = await Cache.get(key);
    if (cached !== null) return JSON.parse(cached);
  }
  const fetched = await fn();
  const options = expire ? { expire } : undefined;
  await Cache.put(key, JSON.stringify(fetched), options);
  return fetched;
};
