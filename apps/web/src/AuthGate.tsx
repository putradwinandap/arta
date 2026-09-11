import { FormEvent, ReactNode, useEffect, useState } from 'react';

type User = { id: string; email: string };
type Mode = 'login' | 'register';

type Props = { children: ReactNode };

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    let code = `http_${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      code = body.error || code;
    } catch {}
    throw new Error(code);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function AuthGate({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authRequest<User>('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const nextUser = await authRequest<User>(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(nextUser);
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message.replaceAll('_', ' ') : 'Authentication failed');
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setSaving(true);
    setError('');
    try {
      await authRequest<void>('/api/auth/logout', { method: 'POST' });
      setUser(null);
      localStorage.removeItem('arta.householdId');
    } catch (err) {
      setError(err instanceof Error ? err.message.replaceAll('_', ' ') : 'Logout failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="center-state"><p>Opening Arta…</p></main>;

  if (!user) {
    return <main className="onboarding-shell"><section className="onboarding-card">
      <p className="eyebrow">Arta</p>
      <h1>{mode === 'login' ? 'Welcome back.' : 'Create your Arta account.'}</h1>
      <p className="muted">Your household finance data is protected by your authenticated account and server-verified household membership.</p>
      {error && <p className="alert" role="alert">{error}</p>}
      <form onSubmit={submit} className="stack-form">
        <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button type="submit" disabled={saving}>{saving ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
      </form>
      <button type="button" className="secondary" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
        {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
      </button>
    </section></main>;
  }

  return <>
    <div className="auth-session-bar">
      <span>Signed in as <strong>{user.email}</strong></span>
      <button type="button" className="secondary" onClick={logout} disabled={saving}>Log out</button>
    </div>
    {error && <p className="alert" role="alert">{error}</p>}
    {children}
  </>;
}
