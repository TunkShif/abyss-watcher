import { Bell, LayoutDashboard, LogOut, Search, Settings, Users, Zap } from "lucide-react";
import type { FC } from "react";
import { data, href, Link, NavLink, Outlet, redirect } from "react-router";
import type { User } from "~/lib/clients/onebot/models";
import { AuthService } from "~/lib/modules/auth";
import { avatarUrl } from "~/lib/utils/avatar";
import { title } from "~/lib/utils/meta";
import type { Route } from "./+types/layout";

export function meta(_: Route.MetaArgs) {
  return [{ title: title("Dashboard") }, { name: "description", content: "Welcome to Abyss Watcher!" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const [user, cookie] = await AuthService.fetchCurrentUser(request);
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

export default function Layout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-neon-purple/30 selection:text-white pb-20">
      <NavBar user={loaderData.user} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Outlet />
      </main>
    </div>
  );
}

const NavBar: FC<{ user: User }> = ({ user }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-abyss-950/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-linear-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <h1 className="text-xl font-bold font-mono tracking-tighter text-white">
            ABYSS<span className="text-slate-500">WATCHER</span>
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <NavLink
            to={href("/dashboard")}
            className="flex items-center gap-2 hover:text-white transition-colors text-white"
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </NavLink>
          <button type="button" className="flex items-center gap-2 hover:text-white transition-colors">
            <Users className="w-4 h-4" /> Friends
          </button>
          <button type="button" className="flex items-center gap-2 hover:text-white transition-colors">
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search entity..."
              className="bg-abyss-900 border border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-neon-blue transition-colors w-64"
            />
          </div>
          <button type="button" className="relative text-slate-400 hover:text-white">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-neon-purple rounded-full"></span>
          </button>
          <div className="flex items-center gap-3 pl-2 border-l border-white/10">
            <span className="hidden lg:block text-xs font-mono text-slate-400">ID: {user.nickname}</span>
            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
              <img src={avatarUrl("user", user.user_id)} alt="Me" />
            </div>
            <Link to={href("/logout")} className="text-slate-500 hover:text-red-400 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
