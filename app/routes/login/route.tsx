import { ArrowRight, Lock, Shield, Zap } from "lucide-react";
import type { PropsWithChildren } from "react";
import { title } from "~/lib/utils/meta";
import { parseSearchParams } from "~/lib/utils/validation";
import { SearchParamsSchema } from "~/routes/login/schema";
import type { Route } from "./+types/route";

export function meta(_: Route.MetaArgs) {
  return [{ title: title("Login") }, { name: "description", content: "Log into Abyss Watcher" }];
}

export function loader({ request }: Route.LoaderArgs) {
  const { step } = parseSearchParams(SearchParamsSchema, request);
  return {
    step,
  };
}

export default function Login({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-abyss-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <BackgrounEffects />
      <LoginForm>{loaderData.step === "input" ? <InputStep /> : <VerifyStep />}</LoginForm>
    </div>
  );
}

const LoginForm = ({ children }: PropsWithChildren) => (
  <div className="w-full max-w-md bg-abyss-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-8 relative z-10">
    <div className="flex flex-col items-center mb-8">
      <div className="w-12 h-12 rounded bg-linear-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20 mb-4">
        <Zap className="w-6 h-6 text-white fill-white" />
      </div>
      <h1 className="text-2xl font-bold font-mono tracking-tighter text-white">
        ABYSS<span className="text-slate-500">WATCHER</span>
      </h1>
      <p className="text-slate-400 text-sm mt-2">Secure Squad Monitoring System</p>
    </div>
    {children}
  </div>
);

const InputStep = () => (
  <form className="space-y-4 animate-in fade-in slide-in-from-right-4">
    <div>
      <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">Identity</label>
      <div className="relative">
        <input
          type="text"
          className="w-full bg-abyss-950 border border-slate-700 rounded-lg py-3 px-4 pl-10 text-slate-200 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
          placeholder="Enter your username"
          autoFocus
        />
        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      </div>
    </div>
    <button
      type="submit"
      className="w-full bg-linear-to-r from-neon-blue to-neon-purple text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-neon-blue/20 hover:shadow-neon-blue/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
    >
      {true ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      ) : (
        <>
          INITIATE LOGIN <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </button>
    <p className="text-center text-xs text-slate-600 mt-4">A verification code will be sent to your bound IM bot.</p>
  </form>
);

const VerifyStep = () => (
  <form className="space-y-4 animate-in fade-in slide-in-from-right-4">
    <div className="text-center mb-4">
      <p className="text-slate-300 text-sm">
        Verification code sent to bot for <span className="text-neon-blue font-bold">{username}</span>
      </p>
      <p className="text-xs text-slate-600 mt-1">
        (Mock: Use code <span className="text-slate-400 font-mono">123456</span>)
      </p>
    </div>

    <div>
      <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">Access Code</label>
      <div className="relative">
        <input
          type="text"
          className={`w-full bg-abyss-950 border ${error ? "border-red-500" : "border-slate-700"} rounded-lg py-3 px-4 pl-10 text-slate-200 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all font-mono tracking-widest text-center text-lg`}
          placeholder="000000"
          maxLength={6}
          autoFocus
        />
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 text-center">{error}</p>}
    </div>

    <button
      type="submit"
      disabled={isLoading || code.length < 6}
      className="w-full bg-white text-abyss-950 font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-abyss-950/30 border-t-abyss-950 rounded-full animate-spin"></div>
      ) : (
        "VERIFY IDENTITY"
      )}
    </button>

    <button type="button" className="w-full text-slate-500 text-xs hover:text-slate-300 transition-colors">
      Change Identity
    </button>
  </form>
);

const BackgrounEffects = () => (
  <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
    <div
      className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl mix-blend-screen animate-pulse"
      style={{ animationDelay: "1s" }}
    ></div>
  </div>
);
