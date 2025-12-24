import type { NotifyService } from "~/lib/modules/notify";
import type { UserId } from "~/lib/modules/onebot/models";
import type { UserService } from "~/lib/modules/user";
import { minutes } from "~/lib/utils/cache";

// TODO: error handling & rate limiting
export class AuthService {
  #kv: KVNamespace;
  #userService: UserService;
  #notifyService: NotifyService;

  constructor(kv: KVNamespace, userService: UserService, notifyService: NotifyService) {
    this.#kv = kv;
    this.#userService = userService;
    this.#notifyService = notifyService;
  }

  async request(userId: UserId) {
    const user = await this.#userService.find(userId);
    if (!user) throw new Error(`unknown user ${userId}`);

    const code = this.#generateCode();
    const hash = await this.#hashCode(code);

    await this.#kv.put(`auth:code:${userId}`, hash, {
      expirationTtl: minutes(2),
    });

    await this.#notifyService.sendAuthRequestMessage(userId, code);
  }

  async verify(userId: UserId, code: string): Promise<boolean> {
    const storedHash = await this.#kv.get(`auth:code:${userId}`);
    if (!storedHash) return false;

    const inputHash = await this.#hashCode(code);
    const isValid = this.#constantTimeEqual(storedHash, inputHash);

    if (isValid) {
      await this.#kv.delete(`auth:code:${userId}`);
    }

    return isValid;
  }

  #generateCode(length = 12): string {
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((x) => charset[x % charset.length])
      .join("");
  }

  async #hashCode(code: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  #constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}
