import { FormEvent, useEffect, useState } from "react";
import {
  getCurrentUser,
  login,
  logout as logoutRequest,
  register,
  type User,
} from "../../lib/api";

type Mode = "login" | "register";

const AUTH_CACHE_KEY = "arta.authUser";
const APP_CACHE_KEY = "arta.appSnapshot";
const ACTIVE_USER_KEY = "arta.activeUserId";
const HOUSEHOLD_KEY = "arta.householdId";

function readCachedUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_CACHE_KEY) || "null") as User | null;
  } catch {
    return null;
  }
}

function clearAuthCache() {
  localStorage.removeItem(AUTH_CACHE_KEY);
  localStorage.removeItem(APP_CACHE_KEY);
  localStorage.removeItem(ACTIVE_USER_KEY);
}

function cacheUser(user: User) {
  localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
  localStorage.setItem(ACTIVE_USER_KEY, user.id);
}

function clearStaleUserSnapshot(nextUser: User) {
  const cached = readCachedUser();
  if (cached?.id && cached.id !== nextUser.id) localStorage.removeItem(APP_CACHE_KEY);
}

export function useAuthSession() {
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
        clearStaleUserSnapshot(nextUser);
        setUser(nextUser);
        cacheUser(nextUser);
      })
      .catch((err) => {
        if (
          err instanceof TypeError ||
          !/^http_401$|^unauthenticated$/.test(err instanceof Error ? err.message : "")
        ) {
          const cached = readCachedUser();
          if (cached?.id && cached.email) {
            setUser(cached);
            setOffline(true);
            localStorage.setItem(ACTIVE_USER_KEY, cached.id);
            setError("Offline mode: server is unavailable.");
            return;
          }
        }
        clearAuthCache();
        localStorage.removeItem(HOUSEHOLD_KEY);
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
      clearStaleUserSnapshot(nextUser);
      setUser(nextUser);
      setOffline(false);
      cacheUser(nextUser);
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
      clearAuthCache();
      localStorage.removeItem(HOUSEHOLD_KEY);
    } catch (err) {
      setError(
        err instanceof Error ? err.message.replaceAll("_", " ") : "Logout failed",
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleMode() {
    setMode((currentMode) => (currentMode === "login" ? "register" : "login"));
    setError("");
  }

  return {
    user,
    offline,
    loading,
    mode,
    email,
    password,
    saving,
    error,
    toggleMode,
    setEmail,
    setPassword,
    submit,
    logout,
  };
}
