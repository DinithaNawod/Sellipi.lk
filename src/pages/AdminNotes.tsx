import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, EyeOff, GraduationCap } from 'lucide-react';
import { fetchReviewNotes, reviewAcademicNote, getApiErrorMessage } from '../services/api';
import type { NoteStatus, ReviewNote, PageInfo } from '../services/api';
import PageControls from '../components/PageControls';
import ReviewDialog from '../components/ReviewDialog';
import { formatDate } from '../utils/formatters';
export default function AdminNotes() {
  const [query, setQuery] = useState<{ status: NoteStatus; page: number }>({ status: 'pending', page: 1 });
  const [notes, setNotes] = useState<ReviewNote[]>([]);
  const [pagination, setPagination] = useState<PageInfo>({ page: 1, pages: 0, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const [decision, setDecision] = useState<{ note: ReviewNote; status: 'approved' | 'rejected' } | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  useEffect(() => {
    let active = true;
    fetchReviewNotes(query.status, query.page).then(value => { if (active) { setNotes(value.notes); setPagination(value.pagination); setError(''); } }).catch(err => { if (active) setError(getApiErrorMessage(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, revision]);
  function refresh() { setLoading(true); setRevision(value => value + 1); }
  function open(note: ReviewNote, status: 'approved' | 'rejected') { setDecision({ note, status }); setReason(''); setFormError(''); }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!decision) return;
    setBusy(true); setFormError('');
    try { const result = await reviewAcademicNote(decision.note._id, decision.status, decision.note.status, reason); setMessage(result.message); setDecision(null); refresh(); }
    catch (err) { setFormError(getApiErrorMessage(err)); }
    finally { setBusy(false); }
  }
  return <section><div className="section-heading"><div><p className="admin-eyebrow">ACADEMIC CONTRIBUTIONS</p><h1>Note Reviews</h1><p>Review corrections and suggestions before they appear on public inscription pages.</p></div><button className="secondary-button" onClick={refresh}>Refresh</button></div><div className="review-tabs" aria-label="Filter note status">{(['pending', 'approved', 'rejected'] as const).map(status => <button key={status} aria-pressed={query.status === status} className={query.status === status ? 'selected' : ''} onClick={() => { setLoading(true); setQuery({ status, page: 1 }); }}>{status === 'approved' ? 'Published' : status === 'pending' ? 'Pending Review' : 'Rejected'}</button>)}</div>{message && <p className="note-success" role="status">{message}</p>}{loading ? <p className="management-empty" role="status">Loading notes…</p> : error ? <p className="inline-alert" role="alert">{error}</p> : <>{!notes.length && <div className="management-panel management-empty"><GraduationCap /><h2>{query.status === 'pending' ? 'You’re all caught up' : 'No notes here yet'}</h2><p>{query.status === 'pending' ? 'New academic submissions will appear here for review.' : 'Notes with this review status will appear here.'}</p></div>}{notes.map(note => <article key={note._id} className="review-card"><div className="review-card-heading"><div>{note.inscription ? <Link to={`/inscription/${note.inscription._id}`}>{note.inscription.title}</Link> : <span>Inscription unavailable</span>}<small>Submitted {formatDate(note.createdAt)}</small></div><span className={`status-badge ${note.status}`}>{note.status === 'approved' ? 'Published' : note.status}</span></div><div className="note-author"><GraduationCap /><div><strong>{note.authorName}</strong>{note.authorInstitution && <span>{note.authorInstitution}</span>}<small>{note.author?.email || 'Account unavailable'}{note.author?.status === 'suspended' && ' · Suspended'}</small></div></div><p className="note-body">{note.text}</p>{note.moderationReason && <p className="review-reason"><strong>Review reason:</strong> {note.moderationReason}</p>}{note.reviewedBy && <p className="review-audit">Reviewed by {note.reviewedBy.username} · {formatDate(note.reviewedAt || '')}</p>}<div className="review-card-actions">{note.status !== 'approved' && <button className="primary-button approve-button" onClick={() => open(note, 'approved')}><Check />Approve &amp; Publish</button>}{note.status !== 'rejected' && <button className="secondary-button reject-button" onClick={() => open(note, 'rejected')}>{note.status === 'approved' ? <EyeOff /> : <X />}{note.status === 'approved' ? 'Unpublish' : 'Reject'}</button>}</div></article>)}<PageControls page={query.page} pages={pagination.pages} total={pagination.total} onChange={page => { setLoading(true); setQuery(value => ({ ...value, page })); }} /></>}
  {decision && <ReviewDialog title={decision.status === 'approved' ? 'Approve and Publish Note' : decision.note.status === 'approved' ? 'Unpublish Note' : 'Reject Note'} busy={busy} onClose={() => { setDecision(null); refresh(); }}><p>By <strong>{decision.note.authorName}</strong>{decision.note.authorInstitution && <> · {decision.note.authorInstitution}</>}</p><blockquote className="review-preview">{decision.note.text}</blockquote><form onSubmit={submit}><p className="dialog-explanation">{decision.status === 'approved' ? 'Confirm that this note is suitable for public display. Approval makes it visible to everyone on the inscription page.' : 'This note will remain hidden from public view. The author can see your feedback in My Notes.'}</p><label>Review feedback <small>(optional)</small><textarea rows={3} maxLength={1000} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} placeholder="Explain your decision to the academic…" /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="dialog-actions"><button type="button" disabled={busy} className="secondary-button" onClick={() => { setDecision(null); refresh(); }}>Cancel</button><button disabled={busy} className="primary-button">{busy ? 'Saving…' : decision.status === 'approved' ? 'Confirm & Publish' : 'Confirm Decision'}</button></div></form></ReviewDialog>}
  </section>;
}
