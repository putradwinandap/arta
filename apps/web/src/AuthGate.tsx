import { FormEvent, ReactNode, useEffect, useState } from "react";
import { AppShell } from "./AppShell";
import {
  getCurrentUser,
  login,
  logout as logoutRequest,
  register,
  type User,
} from "./lib/api";

type Mode = "login" | "register";
type Props = { children: ReactNode };
const AUTH_CACHE_KEY = "arta.authUser";
const APP_CACHE_KEY = "arta.appSnapshot";
export function AuthGate({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    getCurrentUser()
      .then((nextUser) => {
        const cached = JSON.parse(
          localStorage.getItem(AUTH_CACHE_KEY) || "null",
        ) as User | null;
        if (cached?.id && cached.id !== nextUser.id)
          localStorage.removeItem(APP_CACHE_KEY);
        setUser(nextUser);
        localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(nextUser));
        localStorage.setItem("arta.activeUserId", nextUser.id);
      })
      .catch((err) => {
        if (
          err instanceof TypeError ||
          !/^http_401$|^unauthenticated$/.test(err instanceof Error ? err.message : "")
        ) {
          try {
            const cached = JSON.parse(
              localStorage.getItem(AUTH_CACHE_KEY) || "null",
            ) as User | null;
            if (cached?.id && cached.email) {
              setUser(cached);
              setOffline(true);
              localStorage.setItem("arta.activeUserId", cached.id);
              setError("Offline mode: server is unavailable.");
              return;
            }
          } catch {}
        }
        localStorage.removeItem(AUTH_CACHE_KEY);
        localStorage.removeItem(APP_CACHE_KEY);
        localStorage.removeItem("arta.activeUserId");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const nextUser =
        mode === "login"
          ? await login(email, password)
          : await register(email, password);
      const cached = JSON.parse(
        localStorage.getItem(AUTH_CACHE_KEY) || "null",
      ) as User | null;
      if (cached?.id && cached.id !== nextUser.id)
        localStorage.removeItem(APP_CACHE_KEY);
      setUser(nextUser);
      setOffline(false);
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(nextUser));
      localStorage.setItem("arta.activeUserId", nextUser.id);
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replaceAll("_", " ")
          : "Authentication failed",
      );
    } finally {
      setSaving(false);
    }
  }
  async function logout() {
    setSaving(true);
    setError("");
    try {
      await logoutRequest();
      setUser(null);
      localStorage.removeItem(AUTH_CACHE_KEY);
      localStorage.removeItem(APP_CACHE_KEY);
      localStorage.removeItem("arta.activeUserId");
      localStorage.removeItem("arta.householdId");
    } catch (err) {
      setError(
        err instanceof Error ? err.message.replaceAll("_", " ") : "Logout failed",
      );
    } finally {
      setSaving(false);
    }
  }
  if (loading)
    return (
      <main className="center-state">
        <p>Opening Arta…</p>
      </main>
    );
  if (!user)
    return (
      <main className="onboarding-shell">
        <section className="onboarding-card">
          <p className="eyebrow">Arta</p>
          <h1>{mode === "login" ? "Welcome back." : "Create your Arta account."}</h1>
          <p className="muted">
            Your household finance data is protected by your authenticated account and
            server-verified household membership.
          </p>
          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={submit} className="stack-form">
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login"
              ? "Need an account? Register"
              : "Already have an account? Log in"}
          </button>
        </section>
      </main>
    );
  return (
    <AppShell email={user.email} offline={offline} onLogout={() => void logout()}>
      <>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        {children}
      </>
    </AppShell>
  );
}
