import * as v from "valibot";

export const EnvSchema = v.object({
  NODE_ENV: v.optional(v.string()),

  DATABASE_URL: v.string(),
  REDIS_URL: v.string(),

  LOGGING_FILE: v.string(),

  ABYSS_SECRET: v.string(),

  ONEBOT_BASE_URL: v.string(),
  ONEBBOT_TOKEN: v.string(),
  STEAM_WEBAPI_TOKEN: v.string(),
});

export const env = v.parse(EnvSchema, process.env);

export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
