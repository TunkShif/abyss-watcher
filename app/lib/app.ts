import { AuthService } from "~/lib/modules/auth";
import { NotifyService } from "~/lib/modules/notify";
import { createOneBotClient } from "~/lib/modules/onebot";
import { SessionService } from "~/lib/modules/session";
import { UserService } from "~/lib/modules/user";

export interface AbyssApp {
  services: {
    userService: UserService;
    authService: AuthService;
    sessionService: SessionService;
  };
}

export const createAbyssApp = (env: Env): AbyssApp => {
  const bot = createOneBotClient(env.ONEBOT_BASE_URL, env.ONEBOT_TOKEN);

  const notifyService = new NotifyService(bot);

  const userService = new UserService(env.KV, bot);
  const authService = new AuthService(env.KV, userService, notifyService);
  const sessionService = new SessionService(env.KV, userService);

  return {
    services: {
      userService,
      authService,
      sessionService,
    },
  };
};
