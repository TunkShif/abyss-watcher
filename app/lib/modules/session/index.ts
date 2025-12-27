import { Cache } from "~/lib/cache";
import type { User, UserId } from "~/lib/clients/onebot/models";
import { createLogger } from "~/lib/logging";
import { SESSION_MAX_AGE_SECONDS, SESSION_RENEWAL_THRESHOLD_IN_DAYS } from "~/lib/modules/session/config";
import { type SessionToken, SessionTokenSchema } from "~/lib/modules/session/models";
import { createSessionToken, generateExpirationTime, getSessionKey } from "~/lib/modules/session/token";
import { UserService } from "~/lib/modules/user";
import { days, toMs } from "~/lib/utils/duration";

export interface SessionService {
  create(userId: UserId): Promise<SessionToken>;
  validate(sessionToken: SessionToken): Promise<User | null>;
  delete(sessionToken: SessionToken): Promise<void>;
  renew(sessionToken: SessionToken): Promise<SessionToken>;
}

const logger = createLogger("service.session");

export const SessionService: SessionService = {
  async create(userId) {
    const sessionToken = createSessionToken(userId);
    const sessionKey = getSessionKey(sessionToken);
    await Cache.put(sessionKey, sessionToken, { expire: SESSION_MAX_AGE_SECONDS });
    return sessionToken;
  },
  async validate(sessionToken) {
    const sessionKey = getSessionKey(sessionToken);
    const maybeUserToken = await Cache.get(sessionKey, { schema: SessionTokenSchema });
    if (maybeUserToken === null) {
      logger.warn({ userId: sessionToken.userId, sessionKey }, "session not found");
      return null;
    }

    const maybeUser = await UserService.find(maybeUserToken.userId);
    return maybeUser;
  },
  async delete(sessionToken) {
    const sessionKey = getSessionKey(sessionToken);
    await Cache.del(sessionKey);
  },
  async renew(sessionToken) {
    const shouldRenew = Date.now() >= sessionToken.expiresAt - toMs(days(SESSION_RENEWAL_THRESHOLD_IN_DAYS));
    if (shouldRenew) {
      const renewedUserToken = {
        ...sessionToken,
        expiresAt: generateExpirationTime().getTime(),
      };
      const sessionKey = getSessionKey(renewedUserToken);
      await Cache.put(sessionKey, renewedUserToken, { expire: SESSION_MAX_AGE_SECONDS });
      return renewedUserToken;
    }
    return sessionToken;
  },
};
