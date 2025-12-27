import { href, redirect } from "react-router";
import { AuthService } from "~/lib/modules/auth";
import type { Route } from "./+types/logout";

export async function loader({ request }: Route.LoaderArgs) {
  const cookie = await AuthService.logout(request);
  return redirect(href("/login"), {
    headers: { "Set-Cookie": cookie },
  });
}
