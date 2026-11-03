import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchPublicNotes, submitAcademicNote, getApiErrorMessage } from '../services/api';
import type { PublicNote, PageInfo } from '../services/api';
import PageControls from './PageControls';
import ReviewDialog from './ReviewDialog';

export default function AcademicNotes({ inscriptionId }: { inscriptionId: string }) {
  const { user, loading: sessionLoading } = useAuth();
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [pagination, setPagination] = useState<PageInfo>({ page: 1, pages: 0, limit: 20, total: 0 });
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    fetchPublicNotes(inscriptionId, page).then(result => { if (active) { setNotes(result.notes); setPagination(result.pagination); setError(''); } }).catch(err => { if (active) setError(getApiErrorMessage(err, 'Unable to load approved notes.')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [inscriptionId, page, revision]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get('note') || '').trim();
    if (!text || text.length > 3000) { setSubmitError('Enter a note between 1 and 3000 characters.'); return; }
    setBusy(true); setSubmitError('');
    try { const result = await submitAcademicNote(inscriptionId, text); setMessage(result.message); setOpen(false); }
    catch (err) { setSubmitError(getApiErrorMessage(err, 'Your note could not be submitted.')); }
    finally { setBusy(false); }
  }
  return <section className="notes-section"><p>If there is an error, update, or suggestion about this inscription, please inform us.</p>
    {!sessionLoading && user?.role === 'academic' && <button className="primary-button" onClick={() => { setSubmitError(''); setOpen(true); }}><Pencil />Add Note</button>}
    {!sessionLoading && !user && <p className="note-permission"><Link to="/admin/login">Sign in</Link> as an academic to submit a note.</p>}
    {!sessionLoading && user && user.role !== 'academic' && <p className="note-permission">Only academic accounts can submit notes.{user.role === 'admin' && <> Review submissions in the <Link to="/admin/notes">admin dashboard</Link>.</>}</p>}
    {message && <p role="status" className="note-success">{message} <Link to="/account#notes">View My Notes</Link></p>}
    <div className="public-notes" aria-live="polite">{loading ? <p className="state-message"><Loader2 className="animate-spin" />Loading approved notes…</p> : error ? <div className="inline-alert" role="alert">{error}<button onClick={() => { setLoading(true); setRevision(value => value + 1); }}>Retry</button></div> : <><table className="notes-table"><thead><tr><th>Name</th><th>Notes</th></tr></thead><tbody>{notes.length ? notes.map(note => <tr key={note._id}><td><strong>{note.authorName}</strong>{note.authorInstitution && <small>{note.authorInstitution}</small>}</td><td className="public-note-text">{note.text}</td></tr>) : <tr className="empty-note-row"><td colSpan={2} className="no-notes">No approved notes yet.</td></tr>}</tbody></table>{pagination.pages > 1 && <PageControls page={page} pages={pagination.pages} total={pagination.total} onChange={value => { setLoading(true); setPage(value); }} />}</>}</div>
    {open && user?.role === 'academic' && <ReviewDialog title="Submit an Academic Note" onClose={() => setOpen(false)} busy={busy}><p>Submitting as <strong>{user.username}</strong>{user.institution && <> · {user.institution}</>}. Your note will be public only after admin approval.</p><form onSubmit={submit}><label>Note<textarea name="note" required maxLength={3000} rows={7} disabled={busy} placeholder="Add your correction, historical context, or suggestion…" /></label><small>Maximum 3000 characters. Your account name and institution will appear with approved notes.</small>{submitError && <p className="form-error" role="alert">{submitError}</p>}<div className="dialog-actions"><button type="button" className="secondary-button" disabled={busy} onClick={() => setOpen(false)}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? 'Submitting…' : 'Submit for Review'}</button></div></form></ReviewDialog>}
  </section>;
}
