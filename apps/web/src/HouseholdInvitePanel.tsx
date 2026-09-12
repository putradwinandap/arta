import { useState } from 'react';
import { createHouseholdInvite } from './lib/api';

export function HouseholdInvitePanel({ householdId }: { householdId: string }) {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  async function create() {
    setLoading(true); setStatus('');
    try { const invite = await createHouseholdInvite(householdId); setToken(invite.token); setStatus('Invitation created. It can be used once and expires in 7 days.'); }
    catch (error) { setStatus(error instanceof Error ? error.message.replaceAll('_', ' ') : 'Could not create invitation.'); }
    finally { setLoading(false); }
  }
  async function copy() { try { await navigator.clipboard.writeText(token); setStatus('Invitation copied to clipboard.'); } catch { setStatus('Copy is unavailable; select and copy the code manually.'); } }
  return <section className="panel" aria-label="Household invitations"><p className="eyebrow">Family management</p><h2>Invite someone</h2><p className="muted">Create a single-use invite code for a family member. The code expires in 7 days.</p><div className="button-row"><button type="button" onClick={() => void create()} disabled={loading}>{loading ? 'Creating…' : 'Create invitation'}</button>{token && <button type="button" className="secondary" onClick={() => void copy()}>Copy invite code</button>}</div>{token && <label>Invite code<input aria-label="Generated invite code" readOnly value={token} onFocus={(event) => event.currentTarget.select()} /></label>}{status && <p role="status">{status}</p>}</section>;
}
