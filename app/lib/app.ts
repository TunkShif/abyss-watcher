import type { Logger } from "~/lib/logger";
import { AuthService } from "~/lib/modules/auth";
import { NotifyService } from "~/lib/modules/notify";
import { createOneBotClient } from "~/lib/modules/onebot";
import { SessionService } from "~/lib/modules/session";
import { UserService } from "~/lib/modules/user";

export interface AbyssApp {
  services: {
    authService: AuthService;
    userService: UserService;
  };
}

export const createAbyssApp = (env: Env, logger: Logger): AbyssApp => {
  const bot = createOneBotClient(env.ONEBOT_BASE_URL, env.ONEBOT_TOKEN, logger);

  const notifyService = new NotifyService(bot, logger);

  const userService = new UserService(env.KV, bot, logger);
  const sessionService = new SessionService(env.KV, userService, logger);
  const authService = new AuthService(env.KV, userService, sessionService, notifyService, env.ABYSS_SECRET, logger);

  return {
    services: {
      authService,
      userService,
    },
  };
};
