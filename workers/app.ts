import { createRequestHandler } from "react-router";
import { type AbyssApp, createAbyssApp } from "~/lib/app";
import { createLogger } from "~/lib/logger";

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
} satisfies ExportedHandler<Env>;
