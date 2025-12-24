import { href, redirect } from "react-router";
import type { Route } from "./+types/logout";

export async function loader(_: Route.LoaderArgs) {
  return redirect(href("/dashboard"));
}
