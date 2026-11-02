import { useState, useRef, useEffect } from 'react';
import { ImagePlus, Languages, ScanText, Sparkles, X, Copy, Check, Loader2, Info, AlertCircle } from 'lucide-react';
import { translateImageFile, getApiErrorMessage } from '../services/api';
import type { ImageTranslateResult } from '../services/api';
import { SCRIPT_TYPES } from '../utils/formatters';
const accepted = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];
export default function TranslatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [script, setScript] = useState('');
  const [result, setResult] = useState<ImageTranslateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  function selectFile(next?: File) {
    if (!next || loading) return;
    if (!accepted.includes(next.type)) { setError('Unsupported file type. Use JPG, PNG, WebP, TIFF or BMP.'); return; }
    if (next.size > 10 * 1024 * 1024) { setError('Image is larger than 10 MB. Please choose a smaller file.'); return; }
    setFile(next); setPreview(URL.createObjectURL(next)); setResult(null); setError('');
  }
  function reset() { setFile(null); setPreview(''); setResult(null); setError(''); setScript(''); if (fileInput.current) fileInput.current.value = ''; }
  async function translate() {
    if (!file || loading) return;
    setLoading(true); setError(''); setResult(null);
    try { setResult(await translateImageFile(file, script)); }
    catch (err) { setError(getApiErrorMessage(err, 'Unable to process the image. Please try again.')); }
    finally { setLoading(false); }
  }
  async function copy(text: string, section: string) {
    try { await navigator.clipboard.writeText(text); setCopied(section); clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(''), 1500); }
    catch { setError('Clipboard access is unavailable. Select the text and copy it manually.'); }
  }
  return <main className="translate-page"><section className="translate-hero"><p><Sparkles fill="currentColor" />AI-POWERED TOOL</p><h1>Translate an Inscription</h1></section><div className="translate-content content-width">
    <div className="upload-panel"><input ref={fileInput} type="file" accept={accepted.join(',')} onChange={event => selectFile(event.target.files?.[0])} className="sr-only" aria-label="Choose an inscription photograph" />
    {!preview ? <button className={`upload-dropzone ${dragging ? 'dragging' : ''}`} onClick={() => fileInput.current?.click()} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0]); }}><ImagePlus /><span>Drag &amp; drop an image here, or click to browse</span><small>JPG, PNG, WebP, TIFF or BMP - up to 10 MB</small></button> : <div className="selected-upload"><img src={preview} alt="Selected inscription" /><div className="selected-upload-details"><div className="upload-file-row"><div><h2>{file?.name}</h2><p>{((file?.size ?? 0) / 1024 / 1024).toFixed(1)} MB</p></div><button disabled={loading} onClick={reset}><X />Remove</button></div><label htmlFor="script-type">SCRIPT TYPE <span>(optional - improves translation)</span></label><select id="script-type" value={script} disabled={loading} onChange={event => setScript(event.target.value)}><option value="">Auto / Unknown</option>{SCRIPT_TYPES.map(type => <option key={type}>{type}</option>)}</select><button className="primary-button translate-button" disabled={loading} onClick={translate}>{loading ? <Loader2 className="animate-spin" /> : <Languages />}{loading ? 'Processing…' : 'Translate Inscription'}</button>{loading && <p className="processing-status" role="status">Enhancing image, reading text and translating. This may take a moment.</p>}</div></div>}
    {error && <p className="inline-alert" role="alert"><AlertCircle />{error}</p>}</div>
    {result && <div className="translation-results" aria-live="polite"><div className="comparison-images">{[{ url: result.imageUrl, caption: 'Original' }, { url: result.imageProcessedUrl, caption: 'Enhanced for OCR' }].map(item => <figure key={item.caption}><img src={item.url} alt={item.caption} /><figcaption>{item.caption}</figcaption></figure>)}</div>
    <section className="detected-text"><div className="result-heading"><h2><ScanText />Detected Text</h2><div><span className={`confidence ${result.confidence < 40 ? 'low' : result.confidence < 70 ? 'medium' : ''}`}>{result.confidence}% Confidence</span>{result.text && <button onClick={() => copy(result.text, 'text')}>{copied === 'text' ? <Check /> : <Copy />}{copied === 'text' ? 'Copied' : 'Copy'}</button>}</div></div><pre>{result.text || 'No text could be read from this image.'}</pre>{result.confidence < 70 && <p className="confidence-hint"><Info fill="currentColor" />Low confidence is common with weathered stone. Try a sharper, well-lit, straight-on photo for better results.</p>}</section>
    <section className="translated-text"><div className="result-heading"><h2><Languages />Translation</h2>{result.translation && <button onClick={() => copy(result.translation, 'translation')}>{copied === 'translation' ? <Check /> : <Copy />}{copied === 'translation' ? 'Copied' : 'Copy'}</button>}</div><div className="translation-copy">{result.translation || result.translationError || 'Translation is unavailable for this text.'}</div></section><button className="secondary-button translate-another" onClick={reset}><ImagePlus />Translate Another Image</button></div>}
  </div></main>;
}
