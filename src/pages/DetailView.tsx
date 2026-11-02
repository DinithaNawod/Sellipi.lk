import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileDown, Bookmark, Volume2, VolumeX, Pencil, X, Loader2, ImageOff, Image, Trash2 } from 'lucide-react';
import { fetchInscriptionById, getApiErrorMessage } from '../services/api';
import type { Inscription } from '../services/api';
import { formatLocation } from '../utils/formatters';
import { useTTS } from '../hooks/useTTS';
import { readStored, writeStored } from '../utils/browserStorage';
type Note = { name: string; text: string };
export default function DetailView() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<Inscription | null>(null);
  const [error, setError] = useState('');
  const [processed, setProcessed] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>(() => readStored<Note[]>(`sellipi-notes-${id}`, []));
  const [saved, setSaved] = useState(() => readStored<string[]>('sellipi-bookmarks', []).includes(id ?? ''));
  const noteButton = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const { speak, stop, speaking, supported } = useTTS();
  useEffect(() => {
    let active = true;
    if (id) fetchInscriptionById(id).then(value => { if (active) setRecord(value); }).catch(err => { if (active) setError(getApiErrorMessage(err, 'Unable to load inscription.')); });
    return () => { active = false; };
  }, [id]);
  const storedNotes = notes;
  const isSaved = saved;
  function closeNote() { setNoteOpen(false); noteButton.current?.focus(); }
  function dialogKeys(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') closeNote();
    if (event.key !== 'Tab') return;
    const fields = event.currentTarget.querySelectorAll<HTMLElement>('button, input, textarea');
    const first = fields[0], last = fields[fields.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function removeNote(index: number) {
    const next = notes.filter((_, position) => position !== index);
    if (writeStored(`sellipi-notes-${id}`, next)) { setNotes(next); setMessage('Note removed from this device.'); }
    else setMessage('Your browser could not remove this note.');
  }
  function bookmark() {
    const existing = readStored<string[]>('sellipi-bookmarks', []);
    const next = existing.includes(id!) ? existing.filter(value => value !== id) : [...existing, id!];
    if (writeStored('sellipi-bookmarks', next)) { setSaved(next.includes(id!)); setMessage(next.includes(id!) ? 'Bookmarked on this device.' : 'Bookmark removed.'); }
    else setMessage('Your browser could not save this bookmark.');
  }
  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = [...storedNotes, { name: String(data.get('name')).trim(), text: String(data.get('note')).trim() }];
    if (writeStored(`sellipi-notes-${id}`, next)) { setNotes(next); closeNote(); setMessage('Note saved on this device.'); }
    else setMessage('Your browser could not save this note.');
  }
  if (error) return <main className="empty-page"><p role="alert">{error}</p><Link to="/inscriptions" className="primary-button">Back to Archive</Link></main>;
  if (!record) return <main className="empty-page"><Loader2 className="animate-spin" /><p>Loading inscription…</p></main>;
  const metadata = [{ label: 'Publication', value: 'Not recorded' }, { label: 'Inscription Number', value: record.title.match(/(?:no\.?|number|#)\s*(\d+)/i)?.[1] || 'Not recorded' }, { label: 'Site', value: formatLocation(record.location) }, { label: 'Period', value: record.historicalPeriod || 'Not recorded' }, { label: 'Language', value: 'Not recorded' }, { label: 'Script', value: record.scriptType || 'Not recorded' }];
  return <main className="detail-page"><div className="breadcrumbs"><div className="wide-content"><Link to="/inscriptions">Digitalize Inscription Database</Link><span>›</span>{record.title}</div></div><article className="detail-content content-width"><div className="detail-toolbar"><button className="icon-button" onClick={() => window.print()} aria-label="Print or save as PDF"><FileDown /></button><button className="icon-button" onClick={bookmark} aria-label={isSaved ? 'Remove bookmark' : 'Bookmark inscription'} aria-pressed={isSaved}><Bookmark fill={isSaved ? 'currentColor' : 'none'} /></button></div><h1>{record.title}</h1><div className="detail-image">{record.imageUrl && !imageFailed ? <img src={processed && record.imageProcessedUrl ? record.imageProcessedUrl : record.imageUrl} alt={record.title} onError={() => setImageFailed(true)} /> : <span className="image-placeholder"><ImageOff />No image available</span>}{record.imageProcessedUrl && <button className="image-toggle secondary-button" onClick={() => { setProcessed(!processed); setImageFailed(false); }}><Image />{processed ? 'Show Original' : 'Show Enhanced'}</button>}</div><dl className="detail-metadata">{metadata.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
  {record.description && <section className="detail-description"><h2>Description</h2><p>{record.description}</p></section>}
  <section className="detail-text-panel"><h2>Transliteration</h2><p>{record.contentRaw || 'No transcription has been recorded.'}</p></section><section className="detail-text-panel detail-translation"><div><h2>Translation</h2><p>{record.contentTranslated || 'No translation has been recorded.'}</p></div>{supported && record.contentTranslated && <button aria-label={speaking ? 'Stop reading' : 'Listen to translation'} onClick={() => speaking ? stop() : speak(record.contentTranslated)}>{speaking ? <VolumeX /> : <Volume2 />}</button>}</section>
  <section className="notes-section"><p>If there is an error, update, or suggestion about this inscription, please inform us.</p><button ref={noteButton} className="primary-button" onClick={() => setNoteOpen(true)}><Pencil />Add Note</button><p role="status" className="form-status">{message}</p><table className="notes-table"><thead><tr><th>Name</th><th>Notes</th></tr></thead><tbody>{storedNotes.length ? storedNotes.map((note, index) => <tr key={index}><td>{note.name}</td><td>{note.text}<button className="icon-button note-remove" aria-label={`Remove note by ${note.name}`} onClick={() => removeNote(index)}><Trash2 /></button></td></tr>) : <tr className="empty-note-row"><td /><td /></tr>}</tbody></table></section></article>
  {noteOpen && <div className="dialog-backdrop" onClick={closeNote}><section role="dialog" aria-modal="true" aria-labelledby="note-title" className="note-dialog" onClick={event => event.stopPropagation()} onKeyDown={dialogKeys}><button className="icon-button dialog-close" onClick={closeNote} aria-label="Close"><X /></button><h2 id="note-title">Add Note</h2><p>Notes are saved on this device.</p><form onSubmit={addNote}><label>Your name<input name="name" required maxLength={100} autoFocus /></label><label>Note<textarea name="note" required maxLength={3000} rows={5} /></label><button className="primary-button">Save Note</button></form></section></div>}
  </main>;
}
