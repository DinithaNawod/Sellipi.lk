import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, ImageOff, Bookmark } from 'lucide-react';
import type { Inscription } from '../services/api';
import { formatLocation } from '../utils/formatters';
import { readStored, writeStored } from '../utils/browserStorage';
export default function InscriptionCard({ inscription }: { inscription: Inscription }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(() => readStored<string[]>('sellipi-bookmarks', []).includes(inscription._id));
  const [imageFailed, setImageFailed] = useState(false);
  const [message, setMessage] = useState('');
  function bookmark() {
    const existing = readStored<string[]>('sellipi-bookmarks', []);
    const next = existing.includes(inscription._id) ? existing.filter(id => id !== inscription._id) : [...existing, inscription._id];
    if (writeStored('sellipi-bookmarks', next)) setSaved(next.includes(inscription._id));
    else setMessage('Bookmarks could not be saved in this browser.');
    setMenuOpen(false);
  }
  return <article className="inscription-row"><Link className="inscription-thumbnail" to={`/inscription/${inscription._id}`} aria-label={`View ${inscription.title}`}>{inscription.imageUrl && !imageFailed ? <img src={inscription.imageUrl} alt={inscription.title} onError={() => setImageFailed(true)} /> : <span className="image-placeholder"><ImageOff />No image available</span>}</Link><div className="inscription-summary"><p>Inscription Name: {inscription.title}</p><p>Site: {formatLocation(inscription.location)}</p><p>Period: {inscription.historicalPeriod || 'Not recorded'}</p><p>Language: Not recorded</p><p>Script: {inscription.scriptType || 'Not recorded'}</p></div><div className="inscription-actions"><button className="icon-button" aria-label={`More options for ${inscription.title}`} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><MoreVertical /></button>{menuOpen && <button className="row-menu" onClick={bookmark}><Bookmark />{saved ? 'Remove bookmark' : 'Bookmark'}</button>}<Link className="primary-button" to={`/inscription/${inscription._id}`}>View Information &gt;&gt;</Link></div>{message && <p role="status">{message}</p>}</article>;
}
