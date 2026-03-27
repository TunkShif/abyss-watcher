import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login/route.tsx"),
  route("logout", "routes/logout.tsx"),
  layout("routes/layout.tsx", [
    route("dashboard", "routes/dashboard/route.tsx"),
    route("dashboard/group/:groupId/edit", "routes/dashboard/group/edit/route.tsx"),
  ]),
] satisfies RouteConfig;
