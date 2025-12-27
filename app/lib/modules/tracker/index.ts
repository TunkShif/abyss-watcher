import { Cron } from "croner";
import { redis } from "~/lib/cache";
import { createLogger } from "~/lib/logging";
import { GroupService } from "~/lib/modules/group";
import { NotifyService } from "~/lib/modules/notify";
import type { SendActivityMessageTask } from "~/lib/modules/notify/models";
import { PlayerService } from "~/lib/modules/player";
import type { PlayerSummary } from "~/lib/modules/player/models";
import type { PlayerActivity } from "~/lib/modules/tracker/models";
import { minutes } from "~/lib/utils/duration";

export interface Tracker {
  start(): Promise<void>;
  run(): Promise<void>;
}

const logger = createLogger("tracker");

const lockKey = "tracker:lock";
const lockTTL = minutes(10);

let isStarted = false;

export const Tracker: Tracker = {
  async start() {
    if (isStarted) {
      return logger.warn("unexpected tracker restart");
    }
    const job = new Cron("0 */10 * * * *", () => Tracker.run());
    isStarted = true;
    logger.info({ name: job.name, pattern: job.getPattern(), nextRun: job.nextRun() }, "tracker cron job starts");
  },
  async run() {
    const acquired = await acquireLock();
    if (!acquired) {
      logger.info("existing tracker task still running");
      return;
    }

    try {
      logger.info("tracker task starts");

      const players = await PlayerService.list();
      logger.info({ total: players.length }, "loading steam players from database");

      const playerIds = players.map((p) => p.playerId);

      const summaries = await PlayerService.fetchLatestSummaries(playerIds);
      logger.info({ total: summaries.length }, "fetching steam player summaries");

      const localSummaries = await PlayerService.fetchLocalSummaries(playerIds);
      logger.info({ total: localSummaries.length }, "fetching local player summaries");

      const activities = detectPlayerStateChange(summaries, localSummaries);

      await PlayerService.storeLocalSummaries(summaries);
      logger.info({ total: summaries.length }, "storing latest steam player summaries to database");

      if (activities.length === 0) {
        logger.info("no player activity detected");
        return;
      }

      const palyerGroups = await GroupService.listPlayerGroupIds(activities.map((a) => a.playerId));
      const tasks: SendActivityMessageTask[] = activities.flatMap((a) => {
        const groups = palyerGroups[a.playerId] || [];
        return groups.map((groupId) => ({
          groupId,
          user: a.name,
          avatar: a.avatarUrl,
          game: a.gamePlaying,
        }));
      });
      await Promise.all(tasks.map((task) => NotifyService.addSendActivityMessageTask(task)));
      logger.info({ total: tasks.length }, "adding send activity message tasks to queue");
    } catch (err) {
      logger.error({ err }, "tracker task failed");
    } finally {
      await redis.del(lockKey);
    }
  },
};

const acquireLock = async () => {
  const acquired = await redis.set(lockKey, Date.now().toString(), "NX", "EX", lockTTL.toString());
  return acquired !== null;
};

const detectPlayerStateChange = (summaries: PlayerSummary[], localSummaries: (PlayerSummary | null)[]) => {
  const activities: PlayerActivity[] = [];
  const localSummariesMap = new Map(localSummaries.filter((s) => s !== null).map((s) => [s.playerId, s]));
  for (const latest of summaries) {
    const local = localSummariesMap.get(latest.playerId);
    if (latest.gamePlaying && latest.gamePlaying !== local?.gamePlaying) {
      activities.push({
        type: "playing",
        playerId: latest.playerId,
        name: latest.name,
        avatarUrl: latest.avatarUrl,
        gamePlaying: latest.gamePlaying,
      });
    }
  }
  return activities;
};
