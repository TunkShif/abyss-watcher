import { createCookieSessionStorage } from "react-router";
import { Cache } from "~/lib/cache";
import type { User, UserId } from "~/lib/clients/onebot/models";
import { env } from "~/lib/env";
import { createLogger } from "~/lib/logging";
import { VERIFICATION_CODE_EXPIRY_MINUTES, VERIFICATION_CODE_LENGTH } from "~/lib/modules/auth/config";
import { AuthError, type CookieSessionStorageData } from "~/lib/modules/auth/models";
import {
  buildCacheKey,
  constantTimeEqual,
  generateVerificationCode,
  hashVerificationCode,
} from "~/lib/modules/auth/verification";
import { NotifyService } from "~/lib/modules/notify";
import { SessionService } from "~/lib/modules/session";
import { SESSION_MAX_AGE_SECONDS } from "~/lib/modules/session/config";
import { UserService } from "~/lib/modules/user";
import { minutes } from "~/lib/utils/duration";

type Cookie = string;

export interface AuthService {
  requestAuthCode(userId: UserId): Promise<void>;
  login(request: Request, userId: UserId, code: string): Promise<Cookie>;
  logout(request: Request): Promise<Cookie>;
  fetchCurrentUser(request: Request): Promise<[user: User, cookie: Cookie]>;
}

const logger = createLogger("service.auth");

const { getSession, commitSession, destroySession } = createCookieSessionStorage<CookieSessionStorageData>({
  cookie: {
    name: "abyss_session",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: true,
    secrets: [env.ABYSS_SECRET],
  },
});

export const AuthService: AuthService = {
  // TODO: rate limiting
  async requestAuthCode(userId) {
    const user = await UserService.find(userId);
    if (!user) {
      throw new AuthError(AuthError.InvalidUser, `unknown user ${userId}`);
    }

    const code = generateVerificationCode(VERIFICATION_CODE_LENGTH);
    const hash = await hashVerificationCode(code);
    const key = buildCacheKey(userId);
    await Cache.put(key, hash, { expire: minutes(VERIFICATION_CODE_EXPIRY_MINUTES) });

    await NotifyService.sendAuthRequestMessage(userId, code);
  },

  async login(request, userId, code) {
    const success = await verifyCode(userId, code);
    if (!success) {
      logger.warn({ userId }, "login failed: invalid code");
      throw new AuthError(AuthError.InvalidCode, "code verification failed");
    }

    const session = await getSession(request.headers.get("Cookie"));

    const sessionToken = await SessionService.create(userId);
    session.set("sessionToken", sessionToken);
    const cookie = await commitSession(session);

    logger.info({ userId }, "login successful");
    return cookie;
  },

  async logout(request) {
    const session = await getSession(request.headers.get("Cookie"));
    const sessionToken = session.get("sessionToken");
    if (sessionToken) {
      await SessionService.delete(sessionToken);
    }
    return await destroySession(session);
  },

  async fetchCurrentUser(request) {
    const session = await getSession(request.headers.get("Cookie"));
    const sessionToken = session.get("sessionToken");
    if (!sessionToken) {
      throw new AuthError(AuthError.Unauthenticated, "unauthenticated");
    }

    const user = await SessionService.validate(sessionToken);
    if (!user) {
      logger.warn({ sessionToken }, "fetch current user failed: invalid token");
      throw new AuthError(AuthError.InvalidToken, "invalid token");
    }

    const renewedUserToken = await SessionService.renew(sessionToken);
    session.set("sessionToken", renewedUserToken);
    return [user, await commitSession(session)];
  },
};

const verifyCode = async (userId: UserId, code: string) => {
  const key = buildCacheKey(userId);
  const storedHash = await Cache.get(key);
  if (!storedHash) return false;

  const inputHash = await hashVerificationCode(code);
  const isValid = constantTimeEqual(storedHash, inputHash);
  if (isValid) await Cache.del(key);

  return isValid;
};
