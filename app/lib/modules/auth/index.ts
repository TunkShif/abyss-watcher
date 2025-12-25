import { createCookieSessionStorage, type SessionStorage } from "react-router";
import type { Logger } from "~/lib/logger";
import type { CookieSessionData, LoginResult, LogoutResult, ValidateResult } from "~/lib/modules/auth/models";
import type { NotifyService } from "~/lib/modules/notify";
import type { UserId } from "~/lib/modules/onebot/models";
import type { SessionService } from "~/lib/modules/session";
import type { UserService } from "~/lib/modules/user";
import { days, minutes } from "~/lib/utils/cache";

// TODO: error handling & rate limiting
export class AuthService {
  #kv: KVNamespace;
  #userService: UserService;
  #sessionService: SessionService;
  #notifyService: NotifyService;
  #logger: Logger;

  #cookieSessionStorage: SessionStorage<CookieSessionData>;

  constructor(
    kv: KVNamespace,
    userService: UserService,
    sessionService: SessionService,
    notifyService: NotifyService,
    secret: string,
    logger: Logger,
  ) {
    this.#kv = kv;
    this.#userService = userService;
    this.#sessionService = sessionService;
    this.#notifyService = notifyService;
    this.#logger = logger.child({ module: "service.auth" });

    this.#cookieSessionStorage = createCookieSessionStorage({
      cookie: {
        name: "abyss_session",
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: days(14),
        secure: true,
        secrets: [secret],
      },
    });
  }

  async request(userId: UserId) {
    this.#logger.info({ userId }, "requesting auth code");
    const user = await this.#userService.find(userId);
    if (!user) {
      this.#logger.warn({ userId }, "unknown user requested auth");
      throw new Error(`unknown user ${userId}`);
    }

    const code = this.#generateCode();
    const hash = await this.#hashCode(code);

    await this.#kv.put(`auth:code:${userId}`, hash, {
      expirationTtl: minutes(2),
    });

    await this.#notifyService.sendAuthRequestMessage(userId, code);
  }

  async login(request: Request, userId: UserId, code: string): Promise<LoginResult> {
    this.#logger.info({ userId }, "attempting login");
    const session = await this.#cookieSessionStorage.getSession(request.headers.get("Cookie"));

    const success = await this.#verify(userId, code);
    if (!success) {
      this.#logger.warn({ userId }, "login failed: invalid code");
      const cookie = await this.#cookieSessionStorage.commitSession(session);
      return { success, cookie };
    }

    const { token } = await this.#sessionService.create(userId);
    session.set("token", token);
    const cookie = await this.#cookieSessionStorage.commitSession(session);
    this.#logger.info({ userId }, "login successful");
    return { success, cookie };
  }

  async logout(request: Request): Promise<LogoutResult> {
    const session = await this.#cookieSessionStorage.getSession(request.headers.get("Cookie"));
    const token = session.get("token");
    if (token) {
      this.#logger.info("logging out");
      await this.#sessionService.delete(token);
    }
    const cookie = await this.#cookieSessionStorage.destroySession(session);
    return { cookie };
  }

  async validate(request: Request): Promise<ValidateResult> {
    const session = await this.#cookieSessionStorage.getSession(request.headers.get("Cookie"));
    const validateToken = session.get("token");
    if (!validateToken) return { user: null, cookie: await this.#cookieSessionStorage.commitSession(session) };

    const maybeSession = await this.#sessionService.validate(validateToken);
    if (!maybeSession) {
      this.#logger.warn("session validation failed: invalid token");
      return { user: null, cookie: await this.#cookieSessionStorage.destroySession(session) };
    }

    const { user, token } = maybeSession;
    session.set("token", token);
    return { user, cookie: await this.#cookieSessionStorage.commitSession(session) };
  }

  async #verify(userId: UserId, code: string): Promise<boolean> {
    const storedHash = await this.#kv.get(`auth:code:${userId}`);
    if (!storedHash) return false;

    const inputHash = await this.#hashCode(code);
    const isValid = this.#constantTimeEqual(storedHash, inputHash);

    if (isValid) {
      await this.#kv.delete(`auth:code:${userId}`);
    }

    return isValid;
  }

  #generateCode(length = 12): string {
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((x) => charset[x % charset.length])
      .join("");
  }

  async #hashCode(code: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  #constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}
