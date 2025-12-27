import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import type { UserId } from "~/lib/clients/onebot/models";
import { SESSION_MAX_AGE_MILLISECONDS } from "~/lib/modules/session/config";
import type { SessionToken } from "~/lib/modules/session/models";

export const createSessionToken = (userId: UserId): SessionToken => {
  const token = generateToken();
  const expiresAt = generateExpirationTime().getTime();
  return {
    userId: userId.toString(),
    token,
    expiresAt,
  };
};

export const getSessionKey = ({ token }: SessionToken) => {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  return `session:${sessionId}`;
};

export const generateExpirationTime = () => {
  return new Date(Date.now() + SESSION_MAX_AGE_MILLISECONDS);
};

const generateToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const token = encodeBase64url(bytes);
  return token;
};
