import { FormEvent, useState } from 'react';
import { createHousehold, joinHousehold } from './lib/api';

type Mode = 'create' | 'join';
type Props = { embedded?: boolean; onActivated: (householdId: string) => Promise<void> };

export function HouseholdEntry({ embedded = false, onActivated }: Props) {
  const [mode, setMode] = useState<Mode>('create');
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const householdId = mode === 'create' ? (await createHousehold(name)).id : (await joinHousehold(token)).householdId;
      setName(''); setToken(''); await onActivated(householdId);
    } catch (err) { setError(err instanceof Error ? err.message.replaceAll('_', ' ') : 'Could not update household membership.'); }
    finally { setSaving(false); }
  }

  return <section className={embedded ? 'panel household-entry' : 'onboarding-card household-entry'}>
    <p className="eyebrow">{embedded ? 'Household management' : 'Household setup'}</p>
    <h2>{embedded ? 'Create or join another household' : 'Choose how to get started'}</h2>
    <div className="household-tabs" role="tablist" aria-label="Household setup mode">
      <button type="button" role="tab" aria-selected={mode === 'create'} className={mode === 'create' ? '' : 'secondary'} onClick={() => { setMode('create'); setError(''); }}>Create Household</button>
      <button type="button" role="tab" aria-selected={mode === 'join'} className={mode === 'join' ? '' : 'secondary'} onClick={() => { setMode('join'); setError(''); }}>Join Family</button>
    </div>
    {error && <p className="alert" role="alert">{error}</p>}
    <form className="stack-form" onSubmit={submit}>
      {mode === 'create' ? <label>Household name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Keluarga Putra" maxLength={120} required /></label> : <label>Invite code<input value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" required /></label>}
      <button type="submit" disabled={saving}>{saving ? 'Please wait…' : mode === 'create' ? 'Create household' : 'Join household'}</button>
    </form>
  </section>;
}
