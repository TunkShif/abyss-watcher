import { createRequestHandler } from "react-router";
import { type AbyssApp, createAbyssApp } from "~/lib/app";
import { SteamPersonaState } from "~/lib/clients/steam/models";
import { SteamPersonaStateTextMap } from "~/lib/clients/steam/textmap";
import { createLogger } from "~/lib/logger";
import type { UserStats } from "~/lib/modules/stats/models";

declare module "react-router" {
  export interface AppLoadContext {
    app: AbyssApp;
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const logger = createLogger();

const requestHandler = createRequestHandler(() => import("virtual:react-router/server-build"), import.meta.env.MODE);

export default {
  async fetch(request, env, ctx) {
    const app = createAbyssApp(env, logger);
    return requestHandler(request, {
      app,
      cloudflare: { env, ctx },
    });
  },

  async scheduled(_controller, env, ctx) {
    const kv = env.KV;
    const app = createAbyssApp(env, logger);

    const groups = await app.services.statsService.getGroupStats();
    if (groups.length === 0) return;

    const users = new Map<string, UserStats>();
    for (const group of groups) {
      for (const user of group.boundUsers) {
        users.set(user.userId, user);
      }
    }
    if (users.size === 0) return;

    interface ChangedUser {
      userId: string;
      avatarUrl: string;
      text: string;
    }
    const changed: ChangedUser[] = [];

    for (const user of users.values()) {
      const cached = await kv.get<UserStats>(`user:stats:${user.userId}`, "json");

      if (cached === null) {
        if (user.summary.personastate !== SteamPersonaState.Offline) {
          if (user.summary.gameextrainfo) {
            changed.push({
              userId: user.userId,
              avatarUrl: user.summary.avatar,
              text: `${user.userName} 在玩 ${user.summary.gameextrainfo}`,
            });
          } else {
            changed.push({
              userId: user.userId,
              avatarUrl: user.summary.avatar,
              text: `${user.userName} 的状态变成了 ${SteamPersonaStateTextMap[user.summary.personastate]}`,
            });
          }
        }
      } else {
        if (cached.summary.personastate !== user.summary.personastate) {
          changed.push({
            userId: user.userId,
            avatarUrl: user.summary.avatar,
            text: `${user.userName} 的状态变成了 ${SteamPersonaStateTextMap[user.summary.personastate]}`,
          });
        }
        if (cached.summary.gameextrainfo !== user.summary.gameextrainfo) {
          changed.push({
            userId: user.userId,
            avatarUrl: user.summary.avatar,
            text: `${user.userName} 在玩 ${user.summary.gameextrainfo}`,
          });
        }
      }

      await kv.put(`user:stats:${user.userId}`, JSON.stringify(user));
    }

    const tasks: Promise<void>[] = [];
    for (const group of groups) {
      const userIds = group.boundUsers.map((it) => it.userId);
      for (const user of changed) {
        if (userIds.includes(user.userId)) {
          tasks.push(
            app.services.notifyService.sendSimpleNotificationMessage(group.groupId, user.avatarUrl, user.text),
          );
        }
      }
    }

    ctx.waitUntil(Promise.all(tasks));
  },
} satisfies ExportedHandler<Env>;
