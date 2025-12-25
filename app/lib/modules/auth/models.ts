import type { User } from "~/lib/clients/onebot/models";

export interface CookieSessionData {
  token: string;
}

export interface LoginResult {
  success: boolean;
  cookie: string;
}

export interface LogoutResult {
  cookie: string;
}

export interface ValidateResult {
  user: User | null;
  cookie: string;
}
