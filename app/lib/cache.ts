/**
 * Cache Module
 *
 * Provides a Redis-based caching utility with support for simple string caching
 * and structured data caching with Valibot schema validation.
 *
 * Objects are automatically serialized to JSON strings for storage.
 *
 * @module cache
 */

import { RedisClient } from "bun";
import * as v from "valibot";
import { env } from "~/lib/env";

/**
 * Redis client instance configured with the REDIS_URL from environment variables.
 */
export const redis = new RedisClient(env.REDIS_URL);

/**
 * Values that can be stored in the cache.
 * Can be either a simple string or an object with string/number values.
 */
type Cacheable = string | Record<string, unknown>;

/**
 * Options for retrieving cached data with schema validation.
 *
 * @template T - The Valibot schema type for validation
 */
export interface GetOptions<T> {
  /** Valibot schema used to validate and parse the cached data */
  schema: T;
}

/**
 * Options for storing data in the cache.
 */
export interface SetOptions {
  /** Time in seconds until the cached entry expires */
  expire: number;
}

/**
 * Cache interface providing methods for interacting with Redis storage.
 */
export interface Cache {
  /**
   * Retrieves a string value from the cache.
   *
   * @param key - The cache key to retrieve
   * @returns The cached string value or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Retrieves and validates a structured value from the cache using a Valibot schema.
   *
   * @template TSchema - The Valibot schema type for validation
   * @param key - The cache key to retrieve
   * @param options - Options containing the validation schema
   * @returns The validated and parsed cached value or null if not found
   * @throws {v.ValiError} If the cached data doesn't match the schema
   */
  get<const TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
    key: string,
    options?: GetOptions<TSchema>,
  ): Promise<v.InferOutput<TSchema> | null>;

  /**
   * Stores a value in the cache.
   *
   * @param key - The cache key to store the value under
   * @param value - The value to cache (string or object)
   * @param options - Optional settings including expiration time
   *
   * @example
   * // Cache a string
   * await Cache.set('user:123', 'John Doe', { expire: 3600 });
   *
   * @example
   * // Cache an object
   * await Cache.set('user:123:profile', { name: 'John', age: 30 }, { expire: 3600 });
   */
  set(key: string, value: Cacheable, options?: SetOptions): Promise<void>;

  /**
   * Retrieves multiple string values from the cache.
   *
   * @param keys - The cache keys to retrieve
   * @returns An array of cached string values or nulls
   */
  mget(keys: string[]): Promise<(string | null)[]>;

  /**
   * Retrieves and validates multiple structured values from the cache using a Valibot schema.
   *
   * @template TSchema - The Valibot schema type for validation
   * @param keys - The cache keys to retrieve
   * @param options - Options containing the validation schema
   * @returns An array of validated and parsed cached values or nulls
   */
  mget<const TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
    keys: string[],
    options?: GetOptions<TSchema>,
  ): Promise<(v.InferOutput<TSchema> | null)[]>;

  /**
   * Stores multiple values in the cache.
   *
   * @param items - A record of key-value pairs to cache
   * @param options - Optional settings including expiration time
   */
  mset(items: Record<string, Cacheable>, options?: SetOptions): Promise<void>;

  /**
   * Deletes one or more keys from the cache.
   *
   * @param keys - The cache key(s) to delete
   */
  del(...keys: string[]): Promise<void>;
}

/**
 * Cache implementation providing Redis-based caching functionality.
 *
 * Supports both simple string caching and structured object caching.
 * When caching objects, they are serialized to JSON and stored as strings.
 * Retrieved values can be validated using Valibot schemas.
 */
export const Cache: Cache = {
  async get<const TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
    key: string,
    options?: GetOptions<TSchema>,
  ) {
    const value = await redis.get(key);

    if (!value) return null;
    if (!options) return value;

    // Parse JSON and validate with schema
    const parsed = JSON.parse(value);
    return v.parse(options.schema, parsed);
  },
  async set(key, value, options) {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);

    if (options?.expire) {
      await redis.set(key, stringValue, "EX", options.expire);
    } else {
      await redis.set(key, stringValue);
    }
  },
  async mget<const TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
    keys: string[],
    options?: GetOptions<TSchema>,
  ) {
    if (keys.length === 0) return [];

    const values = await redis.mget(...keys);

    if (!options) return values;
    const schema = v.array(v.nullable(options.schema));
    return v.parse(
      schema,
      values.map((value) => {
        if (!value) return null;
        return JSON.parse(value);
      }),
    );
  },
  async mset(items, options) {
    const entries = Object.entries(items);
    if (entries.length === 0) return;

    const args = entries.flatMap(([key, value]) => {
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      return [key, stringValue];
    });

    if (options?.expire) {
      // Use raw command MSETEX for atomic multi-set with expiration
      // MSETEX numkeys key value [key value ...] [EX seconds]
      await redis.send("MSETEX", [entries.length.toString(), ...args, "EX", options.expire.toString()]);
    } else {
      await redis.mset(...args);
    }
  },
  async del(...keys) {
    await redis.del(...keys);
  },
};
