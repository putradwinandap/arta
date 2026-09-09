import { useEffect, useState } from 'react';
import { localDb } from './lib/db';

export function App() {
  const [status, setStatus] = useState('Checking local storage…');

  useEffect(() => {
    localDb.open()
      .then(() => setStatus('Local storage ready'))
      .catch(() => setStatus('Local storage unavailable'));
  }, []);

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Arta foundation</p>
        <h1>Capture now, classify later.</h1>
        <p>Self-hosted family finance, starting with a reliable PWA foundation.</p>
        <p className="status" data-testid="local-db-status">{status}</p>
      </section>
    </main>
  );
}
