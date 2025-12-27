import { isResponseError, isValidationError } from "up-fetch";
import type { Logger } from "~/lib/logging";

interface WithLoggingOptions {
  logger: Logger;
  [x: string]: unknown;
}

export const withLogging = <const TOptions extends WithLoggingOptions>({ logger, ...options }: TOptions) => ({
  ...options,
  onRequest(request: Request) {
    logger.debug({ method: request.method, url: request.url }, "request starts");
  },
  onError(error: unknown, request: Request) {
    const msg = "request failed";
    const bindings = { method: request.method, url: request.url };

    if (isResponseError(error)) {
      return logger.error(
        {
          ...bindings,
          type: "response",
          name: error.name,
          status: error.status,
          error: error.message,
          data: error.data,
        },
        msg,
      );
    }

    if (isValidationError(error)) {
      return logger.error(
        {
          ...bindings,
          name: error.name,
          issues: error.issues,
          error: error.message,
          data: error.data,
          type: "validation",
        },
        msg,
      );
    }

    logger.error({ ...bindings, type: "unknown", error }, msg);
  },
});
