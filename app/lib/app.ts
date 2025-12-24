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

export const createAbyssApp = (env: Env): AbyssApp => {
  const bot = createOneBotClient(env.ONEBOT_BASE_URL, env.ONEBOT_TOKEN);

  const notifyService = new NotifyService(bot);

  const userService = new UserService(env.KV, bot);
  const sessionService = new SessionService(env.KV, userService);
  const authService = new AuthService(env.KV, userService, sessionService, notifyService);

  return {
    services: {
      authService,
      userService,
    },
  };
};
