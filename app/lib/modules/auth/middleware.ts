import { href, type MiddlewareFunction, redirect } from "react-router";
import { createLogger } from "~/lib/logging";
import { commitSession, getSession } from "~/lib/modules/auth";
import { userContext } from "~/lib/modules/auth/context";
import { SessionService } from "~/lib/modules/session";

const logger = createLogger("middleware.auth");

export const authMiddleware: MiddlewareFunction<Response> = async ({ request, context }, next) => {
  const session = await getSession(request.headers.get("Cookie"));
  const sessionToken = session.get("sessionToken");
  if (!sessionToken) {
    throw redirect(href("/login"));
  }

  const user = await SessionService.validate(sessionToken);
  if (!user) {
    logger.warn({ sessionToken }, "fetch current user failed: invalid token");
    throw redirect(href("/login"));
  }
  context.set(userContext, user);

  const renewedUserToken = await SessionService.renew(sessionToken);
  session.set("sessionToken", renewedUserToken);
  const cookie = await commitSession(session);

  const response = await next();
  response.headers.append("Set-Cookie", cookie);
  return response;
};
