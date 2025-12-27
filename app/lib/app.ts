import { createOneBotClient } from "~/lib/clients/onebot";
import { createSteamAPIClient } from "~/lib/clients/steam";
import { createDatabase } from "~/lib/database";
import type { Logger } from "~/lib/logging";
import { AuthService } from "~/lib/modules/auth";
import { GroupService } from "~/lib/modules/group";
import { NotifyService } from "~/lib/modules/notify";
import { SessionService } from "~/lib/modules/session";
import { StatsService } from "~/lib/modules/stats";
import { UserService } from "~/lib/modules/user";

export interface AbyssApp {
  services: {
    authService: AuthService;
    userService: UserService;
    groupService: GroupService;
    notifyService: NotifyService;
    statsService: StatsService;
  };
}

export const createAbyssApp = (env: Env, logger: Logger): AbyssApp => {
  const db = createDatabase(env.DB);

  const bot = createOneBotClient(env.ONEBOT_BASE_URL, env.ONEBOT_TOKEN, logger);
  const steam = createSteamAPIClient(env.STEAM_WEBAPI_TOKEN);

  const notifyService = new NotifyService(bot, logger);

  const userService = new UserService(env.KV, bot, logger);
  const groupService = new GroupService(db, env.KV, bot, logger);
  const sessionService = new SessionService(env.KV, userService, logger);
  const authService = new AuthService(env.KV, userService, sessionService, notifyService, env.ABYSS_SECRET, logger);

  const statsService = new StatsService(steam, groupService, logger);

  return {
    services: {
      authService,
      userService,
      groupService,
      notifyService,
      statsService,
    },
  };
};
