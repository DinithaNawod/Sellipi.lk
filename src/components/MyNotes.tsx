import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyNotes, getApiErrorMessage } from '../services/api';
import type { ReviewNote, PageInfo } from '../services/api';
import PageControls from './PageControls';
import { formatDate } from '../utils/formatters';
export default function MyNotes() {
  const [notes, setNotes] = useState<ReviewNote[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PageInfo>({ page: 1, pages: 0, limit: 20, total: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    fetchMyNotes(page).then(result => { if (active) { setNotes(result.notes); setPagination(result.pagination); setError(''); } }).catch(err => { if (active) setError(getApiErrorMessage(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, revision]);
  return <section className="my-notes"><div className="section-heading"><div><h1>My Notes</h1><p>Follow the review status of your academic contributions.</p></div><button className="secondary-button" onClick={() => { setLoading(true); setRevision(value => value + 1); }}>Refresh</button></div>{loading ? <p role="status">Loading your notes…</p> : error ? <p role="alert" className="form-error">{error}</p> : <>{!notes.length && <p className="management-empty">You have not submitted any notes yet. Open an inscription and select Add Note to contribute.</p>}{notes.map(note => <article key={note._id} className="review-card"><div className="review-card-heading">{note.inscription ? <Link to={`/inscription/${note.inscription._id}`}>{note.inscription.title}</Link> : <span>Inscription unavailable</span>}<span className={`status-badge ${note.status}`}>{note.status}</span></div><p className="note-body">{note.text}</p><small>Submitted {formatDate(note.createdAt)}</small>{note.moderationReason && <p className="review-reason"><strong>Admin feedback:</strong> {note.moderationReason}</p>}</article>)}<PageControls page={page} pages={pagination.pages} total={pagination.total} onChange={value => { setLoading(true); setPage(value); }} /></>}</section>;
}
