import type { SessionToken } from "~/lib/modules/session/models";

export type AuthErrorCode = "unauthenticated" | "invalid-user" | "invalid-code" | "invalid-token";

export class AuthError extends Error {
  name = "AuthError";

  static Unauthenticated: AuthErrorCode = "unauthenticated";
  static InvalidUser: AuthErrorCode = "invalid-user";
  static InvalidCode: AuthErrorCode = "invalid-code";
  static InvalidToken: AuthErrorCode = "invalid-token";

  constructor(
    public code: AuthErrorCode,
    message?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export interface CookieSessionStorageData {
  sessionToken: SessionToken;
}
