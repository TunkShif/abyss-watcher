import { data, href, Outlet, redirect } from "react-router";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const app = context.app;
  const { user, cookie } = await app.services.authService.validate(request);
  if (!user) {
    return redirect(href("/login"), {
      headers: { "Set-Cookie": cookie },
    });
  }
  return data(
    { user },
    {
      headers: { "Set-Cookie": cookie },
    },
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      hello {JSON.stringify(loaderData.user)}
      <Outlet />
    </div>
  );
}
