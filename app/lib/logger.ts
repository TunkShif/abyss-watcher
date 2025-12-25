type Structured = Record<string, unknown>;

type LogFn = {
  (m: string): void;
  (v: Structured, m: string): void;
};

export interface Logger {
  child: (v: Structured) => Logger;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

export const createLogger = (context: Structured = {}): Logger => {
  const log = (fn: (data: Structured) => void): LogFn => {
    return (vOrM: string | Structured, m?: string) => {
      const v = typeof vOrM === "string" ? {} : vOrM;
      const message = typeof vOrM === "string" ? vOrM : (m ?? "");
      fn({ ...context, ...v, message });
    };
  };

  return {
    child: (v) => createLogger({ ...context, ...v }),
    debug: log(console.debug),
    info: log(console.log),
    warn: log(console.warn),
    error: log(console.error),
  };
};

const noop: LogFn = () => {};

export const noopLogger: Logger = {
  child: () => noopLogger,
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};
