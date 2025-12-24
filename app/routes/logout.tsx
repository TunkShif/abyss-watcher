import { href, redirect } from "react-router";
import type { Route } from "./+types/logout";

export async function loader({ request, context }: Route.LoaderArgs) {
  const app = context.app;
  const { cookie } = await app.services.authService.logout(request);
  return redirect(href("/login"), {
    headers: { "Set-Cookie": cookie },
  });
}
