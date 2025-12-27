import pino from "pino";
import { env, isProduction } from "~/lib/env";

const targets = isProduction
  ? [
      {
        target: "pino/file",
        options: {
          destination: 1,
        },
      },
      {
        target: "pino-roll",
        options: {
          file: env.LOGGING_FILE,
          frequency: "daily",
          symlink: true,
          mkdir: true,
          limit: {
            count: 14,
          },
        },
      },
    ]
  : [{ target: "pino-pretty" }, { target: "pino/file", options: { destination: env.LOGGING_FILE } }];

export const globalLogger = pino({
  transport: { targets },
});

export const createLogger = (component: string) => globalLogger.child({ component });

export type Logger = typeof globalLogger;
