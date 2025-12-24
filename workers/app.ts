import { createRequestHandler } from "react-router";
import { type AbyssApp, createAbyssApp } from "~/lib/app";

declare module "react-router" {
  export interface AppLoadContext {
    app: AbyssApp;
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(() => import("virtual:react-router/server-build"), import.meta.env.MODE);

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      app: createAbyssApp(env),
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
