import { chunk } from "es-toolkit";
import type { UserId } from "~/lib/clients/onebot/models";

export const buildCacheKey = (userId: UserId) => `auth:code:${userId}`;

export const generateVerificationCode = (length = 12) => {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((x) => charset[x % charset.length])
    .join("");
};

export const toSegmentedFormat = (code: string) =>
  chunk(code.split(""), 4)
    .map((segment) => segment.join(""))
    .join("-");

export const toVerificationCode = (code: string) => code.replaceAll("-", "");

export const hashVerificationCode = async (code: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const constantTimeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};
