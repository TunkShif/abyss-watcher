import { ArrowRight, Lock, Shield, Zap } from "lucide-react";
import type { PropsWithChildren } from "react";
import { Form, href, redirect, useActionData, useNavigation } from "react-router";
import { title } from "~/lib/utils/meta";
import { parseFormData } from "~/lib/utils/validation";
import { FormSchema } from "~/routes/login/schema";
import type { Route } from "./+types/route";

export function meta(_: Route.MetaArgs) {
  return [{ title: title("Login") }, { name: "description", content: "Log into Abyss Watcher" }];
}

export async function action({ request, context: { app } }: Route.ActionArgs) {
  const form = await parseFormData(FormSchema, request);
  if (form.intent === "request") {
    await app.services.authService.request(form.userId);
    return {
      step: "verify",
      userId: form.userId,
      success: true,
    };
  } else if (form.intent === "verify") {
    const success = await app.services.authService.verify(form.userId, form.code);
    if (success) {
      return redirect(href("/dashboard"));
    } else {
      return {
        step: "request",
        userId: form.userId,
        success: false,
      };
    }
  }
}

export default function Login({ actionData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-abyss-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <BackgrounEffects />
      <LoginForm>{actionData?.step === "verify" ? <VerifyStep /> : <InputStep />}</LoginForm>
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

const InputStep = () => {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);

  const data = useActionData<typeof action>();
  const error = !(data?.success ?? true);

  return (
    <Form method="post" className="space-y-4 animate-in fade-in slide-in-from-right-4">
      <div>
        <label htmlFor="userId" className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">
          Identity
        </label>
        <div className="relative">
          <input
            type="text"
            name="userId"
            className="w-full bg-abyss-950 border border-slate-700 rounded-lg py-3 px-4 pl-10 text-slate-200 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
            placeholder="Enter your QQ"
          />
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-1 text-center">Failed to Authenticate!</p>}
      <input type="hidden" name="intent" value="request" />

      <button
        type="submit"
        className="w-full bg-linear-to-r from-neon-blue to-neon-purple text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-neon-blue/20 hover:shadow-neon-blue/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
      >
        {isNavigating ? (
          <Spinner />
        ) : (
          <>
            INITIATE LOGIN <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
      <p className="text-center text-xs text-slate-600 mt-4">A verification code will be sent to your bound IM bot.</p>
    </Form>
  );
};

const VerifyStep = () => {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);

  const data = useActionData<typeof action>();

  return (
    <Form method="post" className="space-y-4 animate-in fade-in slide-in-from-right-4">
      <div className="text-center mb-4">
        <p className="text-slate-300 text-sm">
          Verification code sent from bot to <span className="text-neon-blue font-bold">{data?.userId}</span>
        </p>
      </div>

      <div>
        <label htmlFor="code" className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">
          Access Code
        </label>
        <div className="relative">
          <input
            type="text"
            name="code"
            className={`w-full bg-abyss-950 border rounded-lg py-3 px-4 pl-10 text-slate-200 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all font-mono tracking-widest text-center text-lg`}
            placeholder="xxxx-xxxx-xxxx"
            required
            minLength={12}
            maxLength={12}
          />
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        </div>
      </div>

      <input type="hidden" name="userId" value={data?.userId ?? ""} />
      <input type="hidden" name="intent" value="verify" />

      <button
        type="submit"
        disabled={isNavigating}
        className="w-full bg-white text-abyss-950 font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isNavigating ? <Spinner /> : "VERIFY IDENTITY"}
      </button>
    </Form>
  );
};

const Spinner = () => <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />;

const BackgrounEffects = () => (
  <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
    <div
      className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl mix-blend-screen animate-pulse"
      style={{ animationDelay: "1s" }}
    ></div>
  </div>
);
