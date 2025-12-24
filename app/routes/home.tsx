import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.DATABASE_URL };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <div>hello {loaderData.message}</div>;
}
