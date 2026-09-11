import { FormEvent, useState } from 'react';

const HOUSEHOLD_STORAGE_KEY = 'arta.householdId';

type JoinResult = { householdId: string };

export function HouseholdJoin() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  async function join(event: FormEvent) {
    event.preventDefault();
    setJoining(true);
    setError('');
    try {
      const response = await fetch('/api/invites/redeem', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      if (!response.ok) {
        let message = 'Could not join household.';
        try {
          const body = await response.json() as { error?: string };
          if (body.error) message = body.error.replaceAll('_', ' ');
        } catch {}
        throw new Error(message);
      }
      const result = await response.json() as JoinResult;
      localStorage.setItem(HOUSEHOLD_STORAGE_KEY, result.householdId);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join household.');
    } finally {
      setJoining(false);
    }
  }

  return <section className="onboarding-card">
    <p className="eyebrow">Join family</p>
    <h2>Have an invite?</h2>
    <p className="muted">Paste the invite code shared by the household owner.</p>
    {error && <p className="alert" role="alert">{error}</p>}
    <form className="stack-form" onSubmit={join}>
      <label>Invite code<input value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" required /></label>
      <button type="submit" disabled={joining}>{joining ? 'Joining…' : 'Join household'}</button>
    </form>
  </section>;
}
