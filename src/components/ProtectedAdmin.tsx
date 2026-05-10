import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

const ADMIN_PASSWORD = "family2026";
const SESSION_KEY = "family-memoirs-admin";

export function ProtectedAdmin({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(SESSION_KEY) === "true";
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-10 text-ink">
      <form
        className="glass w-full max-w-sm rounded-[2rem] p-6"
        onSubmit={(event) => {
          event.preventDefault();

          if (password === ADMIN_PASSWORD) {
            window.sessionStorage.setItem(SESSION_KEY, "true");
            setAllowed(true);
            return;
          }

          setError("密码不正确");
        }}
      >
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-full bg-ink text-paper">
          <Lock className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-semibold">管理家庭回忆录</h1>
        <label className="mt-7 block">
          <span className="mb-2 block text-sm font-bold text-ink/58">访问密码</span>
          <input
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            type="password"
            autoFocus
            className="min-h-14 w-full rounded-2xl border border-tea/20 bg-white/76 px-4 text-lg outline-none ring-rosewood/20 transition focus:ring-4"
          />
        </label>
        {error ? <p className="mt-3 font-semibold text-rosewood">{error}</p> : null}
        <button
          type="submit"
          className="mt-6 min-h-14 w-full rounded-2xl bg-ink px-5 text-lg font-bold text-paper shadow-soft"
        >
          进入
        </button>
      </form>
    </main>
  );
}
