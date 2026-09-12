import { ChangeEvent, useEffect, useState } from 'react';

type BackupMetadata = { format: string; version: number; householdId: string; exportedAt: string };
const householdKey = 'arta.householdId';

export function BackupRestoreMount() {
  const [householdId, setHouseholdId] = useState(localStorage.getItem(householdKey) || '');
  const [fileText, setFileText] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = localStorage.getItem(householdKey) || '';
      setHouseholdId((current) => current === next ? current : next);
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setFileText(null);
    setMessage('');
    setBusy(false);
  }, [householdId]);

  if (!householdId) return null;

  async function download() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/households/${householdId}/backup`);
      if (!response.ok) throw new Error('Backup gagal dibuat.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `arta-${householdId}-backup.json`; anchor.click();
      URL.revokeObjectURL(url);
      setMessage('Backup berhasil dibuat dan diunduh.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Backup gagal.'); }
    finally { setBusy(false); }
  }

  async function select(event: ChangeEvent<HTMLInputElement>) {
    setMessage('');
    const file = event.target.files?.[0];
    if (!file) { setFileText(null); return; }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupMetadata;
      if (parsed.format !== 'arta-household-backup' || parsed.version !== 1 || parsed.householdId !== householdId) throw new Error('File backup tidak kompatibel dengan household ini.');
      setFileText(text); setMessage(`Backup v${parsed.version} siap dipulihkan.`);
    } catch (error) { setFileText(null); setMessage(error instanceof Error ? error.message : 'File backup tidak valid.'); }
  }

  async function restore() {
    if (!fileText) return;
    const confirmed = window.confirm('Restore akan MENGGANTI seluruh data financial household ini dengan isi backup. Proses tidak dapat dibatalkan. Lanjutkan?');
    if (!confirmed) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/households/${householdId}/restore`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Arta-Restore-Confirm': 'replace' }, body: fileText });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'Restore gagal.'); }
      setMessage('Restore berhasil. Muat ulang halaman untuk melihat data yang dipulihkan.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Restore gagal.'); }
    finally { setBusy(false); }
  }

  return <section className="panel" aria-labelledby="backup-restore-title"><h2 id="backup-restore-title">Backup & Restore</h2><p>Lindungi seluruh catatan keuangan household tanpa akses langsung ke database.</p><div className="actions"><button disabled={busy} onClick={download}>Download backup</button><label>File backup <input type="file" accept="application/json,.json" disabled={busy} onChange={select} /></label><button disabled={busy || !fileText} onClick={restore}>Restore backup</button></div><p role="status">{message}</p><p><strong>Perhatian:</strong> restore mengganti data household saat ini. Arta memvalidasi format dan versi sebelum perubahan dilakukan.</p></section>;
}
