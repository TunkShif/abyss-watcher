import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import type { Database } from "~/lib/database";
import type { UserId } from "~/lib/modules/onebot/models";
import { type SessionData, SessionDataSchema } from "~/lib/modules/session/models";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export class SessionService {
  #db: Database;
  #kv: KVNamespace;

  private static SESSION_MAX_AGE = 14 * DAY_IN_MS;
  private static SESSION_RENEW_BEFORE_DAYS = 3;

  constructor(env: Env, db: Database) {
    this.#kv = env.KV;
    this.#db = db;
  }

  async create(userId: UserId) {
    const token = this.#generateSessionToken();
    const sessionId = this.#buildUserSessionId(token);
    const sessionData = await this.#putUserSessionData(userId, sessionId);
    return {
      token,
      expiresAt: sessionData.expiresAt,
    };
  }

  async validate(token: string) {
    const sessionId = this.#buildUserSessionId(token);
    const key = this.#buildUserSessionKey(sessionId);
    const value = await this.#kv.get(key);
    if (value == null) return null;

    const sessionData = v.parse(SessionDataSchema, JSON.parse(value));
    const { userId, expiresAt } = sessionData;
    const user = await this.#db.select().from(users).where(eq(users.id, userId)).get();
    if (user == null) return null;

    if (this.#shouldRenewSession(expiresAt)) {
      const renewedSession = await this.#renew(userId, sessionId);
      return {
        user,
        token,
        expiresAt: renewedSession.expiresAt,
      };
    }

    return {
      user,
      token,
      expiresAt: sessionData.expiresAt,
    };
  }

  async delete(token: string) {
    const sessionId = this.#buildUserSessionId(token);
    const key = this.#buildUserSessionKey(sessionId);
    return this.#kv.delete(key);
  }

  #renew(userId: UserId, sessionId: string) {
    return this.#putUserSessionData(userId, sessionId);
  }

  async #putUserSessionData(userId: UserId, sessionId: string) {
    const key = this.#buildUserSessionKey(sessionId);
    const expiresAt = this.#buildExpirationTime();
    const sessionData = this.#buildUserSessionData(userId, expiresAt);
    await this.#kv.put(key, JSON.stringify(sessionData), {
      expiration: expiresAt.getTime() / 1000,
    });
    return sessionData;
  }

  #generateSessionToken() {
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    const token = encodeBase64url(bytes);
    return token;
  }

  #buildUserSessionId(token: string) {
    return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  }

  #buildExpirationTime() {
    return new Date(Date.now() + SessionService.SESSION_MAX_AGE);
  }

  #buildUserSessionKey(sessionId: string) {
    return `session:${sessionId}`;
  }

  #buildUserSessionData(userId: UserId, expiresAt: Date) {
    return { userId: userId.toString(), expiresAt: expiresAt.getTime() } satisfies SessionData;
  }

  #shouldRenewSession(expiresAt: number) {
    return Date.now() >= expiresAt - SessionService.SESSION_RENEW_BEFORE_DAYS * DAY_IN_MS;
  }
}
