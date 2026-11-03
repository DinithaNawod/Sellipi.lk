import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileDown, Bookmark, Volume2, VolumeX, Loader2, ImageOff, Image } from 'lucide-react';
import { fetchInscriptionById, getApiErrorMessage } from '../services/api';
import type { Inscription } from '../services/api';
import { formatLocation } from '../utils/formatters';
import { useTTS } from '../hooks/useTTS';
import { readStored, writeStored } from '../utils/browserStorage';
import AcademicNotes from '../components/AcademicNotes';
const InscriptionLocationMap = lazy(() => import('../components/InscriptionLocationMap'));
export default function DetailView() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<Inscription | null>(null);
  const [error, setError] = useState('');
  const [processed, setProcessed] = useState(false);
  const [saved, setSaved] = useState(() => readStored<string[]>('sellipi-bookmarks', []).includes(id ?? ''));
  const [message, setMessage] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const { speak, stop, speaking, supported, error: speechError } = useTTS();
  useEffect(() => {
    let active = true;
    if (id) fetchInscriptionById(id).then(value => { if (active) setRecord(value); }).catch(err => { if (active) setError(getApiErrorMessage(err, 'Unable to load inscription.')); });
    return () => { active = false; };
  }, [id]);
  const isSaved = saved;
  function bookmark() {
    const existing = readStored<string[]>('sellipi-bookmarks', []);
    const next = existing.includes(id!) ? existing.filter(value => value !== id) : [...existing, id!];
    if (writeStored('sellipi-bookmarks', next)) { setSaved(next.includes(id!)); setMessage(next.includes(id!) ? 'Bookmarked on this device.' : 'Bookmark removed.'); }
    else setMessage('Your browser could not save this bookmark.');
  }
  if (error) return <main className="empty-page"><p role="alert">{error}</p><Link to="/inscriptions" className="primary-button">Back to Archive</Link></main>;
  if (!record) return <main className="empty-page"><Loader2 className="animate-spin" /><p>Loading inscription…</p></main>;
  const metadata = [{ label: 'Publication', value: 'Not recorded' }, { label: 'Inscription Number', value: record.title.match(/(?:no\.?|number|#)\s*(\d+)/i)?.[1] || 'Not recorded' }, { label: 'Site', value: formatLocation(record.location) }, { label: 'Period', value: record.historicalPeriod || 'Not recorded' }, { label: 'Language', value: 'Not recorded' }, { label: 'Script', value: record.scriptType || 'Not recorded' }];
  return <main className="detail-page"><div className="breadcrumbs"><div className="wide-content"><Link to="/inscriptions">Digitalize Inscription Database</Link><span>›</span>{record.title}</div></div><article className="detail-content content-width"><div className="detail-toolbar"><button className="icon-button" onClick={() => window.print()} aria-label="Print or save as PDF"><FileDown /></button><button className="icon-button" onClick={bookmark} aria-label={isSaved ? 'Remove bookmark' : 'Bookmark inscription'} aria-pressed={isSaved}><Bookmark fill={isSaved ? 'currentColor' : 'none'} /></button></div><h1>{record.title}</h1><div className="detail-image">{record.imageUrl && !imageFailed ? <img src={processed && record.imageProcessedUrl ? record.imageProcessedUrl : record.imageUrl} alt={record.title} onError={() => setImageFailed(true)} /> : <span className="image-placeholder"><ImageOff />No image available</span>}{record.imageProcessedUrl && <button className="image-toggle secondary-button" onClick={() => { setProcessed(!processed); setImageFailed(false); }}><Image />{processed ? 'Show Original' : 'Show Enhanced'}</button>}</div><dl className="detail-metadata">{metadata.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
  <Suspense fallback={<p role="status">Loading site location…</p>}><InscriptionLocationMap record={record} /></Suspense>
  {record.description && <section className="detail-description"><h2>Description</h2><p>{record.description}</p></section>}
  <section className="detail-text-panel"><h2>Transliteration</h2><p>{record.contentRaw || 'No transcription has been recorded.'}</p></section><section className="detail-text-panel detail-translation"><div><h2>Translation</h2><p>{record.contentTranslated || 'No translation has been recorded.'}</p></div>{record.contentTranslated && <button type="button" disabled={!supported} aria-pressed={speaking} title={!supported ? 'Speech is unavailable in this browser' : speaking ? 'Stop reading' : 'Listen to translation'} aria-label={speaking ? 'Stop reading' : 'Listen to translation'} onClick={() => speaking ? stop() : speak(record.contentTranslated)}>{speaking ? <VolumeX /> : <Volume2 />}</button>}</section>
  {speechError && <p role="alert" className="form-error">{speechError}</p>}{record.contentTranslated && !supported && <p className="form-status">Text-to-speech is unavailable in this browser.</p>}{speaking && <p role="status" className="form-status">Reading the translation aloud. Click the speaker again to stop.</p>}{message && <p role="status" className="form-status">{message}</p>}<AcademicNotes inscriptionId={id!} /></article>
  </main>;
}
