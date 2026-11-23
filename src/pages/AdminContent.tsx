import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Video, Trash2, Loader2 } from 'lucide-react';
import catalog from '../../shared/siteContent.json';
import { fetchSiteContent, saveSiteContent, uploadSiteVideo, getApiErrorMessage } from '../services/api';
import { useSiteContent } from '../context/SiteContentContext';

const groups = [...new Set(catalog.map(field => field.group))];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const ACCEPTED_VIDEO_EXTS = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;

export default function AdminContent() {
  const { refresh } = useSiteContent();
  const [values, setValues] = useState<Record<string, string>>({});
  const [revision, setRevision] = useState(0);
  const [group, setGroup] = useState('Home');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load() {
    setLoading(true); setError('');
    try { const data = await fetchSiteContent(); setValues(data.values); setRevision(data.revision); setDirty(false); }
    catch (err) { setError(getApiErrorMessage(err)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => { if (!dirty) return; const warn = (event: BeforeUnloadEvent) => event.preventDefault(); window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);

  async function save() {
    setBusy(true); setError(''); setMessage('');
    try { const data = await saveSiteContent({ values, revision }); setRevision(data.revision); setValues(data.values); setDirty(false); await refresh(); setMessage('Site content published. Visitors will see the changes on their next page load.'); }
    catch (err) { setError(getApiErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleVideoUpload(fieldKey: string, file?: File) {
    if (!file) return;
    if (!file.type.startsWith('video/') && !ACCEPTED_VIDEO_EXTS.test(file.name)) {
      setError('Unsupported video format. Please choose an MP4, WebM, OGG, MOV, or M4V video.');
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setError('Video is too large. Maximum file size is 100 MB.');
      return;
    }
    setError('');
    setMessage('');
    setUploadingField(fieldKey);
    setUploadProgress(0);
    try {
      const result = await uploadSiteVideo(file, (percent) => setUploadProgress(percent));
      setValues(current => ({ ...current, [fieldKey]: result.videoUrl }));
      setDirty(true);
      setMessage('Video uploaded! Click "Publish Changes" below to display it on the website.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Video upload failed.'));
    } finally {
      setUploadingField(null);
      setUploadProgress(0);
    }
  }

  return <section className="site-content-editor"><div className="section-heading"><div><p className="admin-eyebrow">WEBSITE CONTENT</p><h1>Site Content & Contact Details</h1><p>Edit public descriptions, headings, links, images, and the home hero video. Publishing applies changes across the website.</p></div><Link className="secondary-button" to="/">View Website</Link></div>
    <p>Manage inscription descriptions, translations, locations, and images in <Link to="/admin/inscriptions">Inscriptions</Link>. Manage account access in <Link to="/admin/users">User Management</Link>.</p>
    <div className="management-filters"><label>Section<select value={group} onChange={event => setGroup(event.target.value)}>{groups.map(name => <option key={name}>{name}</option>)}</select></label><label className="management-search"><input aria-label="Search content" placeholder="Search fields in this section" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
    {error && <p className="inline-alert" role="alert">{error}</p>}{message && <p className="note-success" role="status">{message}</p>}
    {loading ? <p role="status">Loading site content…</p> : <form onSubmit={event => { event.preventDefault(); void save(); }}><fieldset disabled={busy || uploadingField !== null}><div className="content-fields">{catalog.filter(field => field.group === group && (field.label + field.value).toLowerCase().includes(search.toLowerCase())).map(field => {
      const fieldValue = values[field.key] ?? field.value;
      if (field.type === 'video') {
        const isUploading = uploadingField === field.key;
        return <div className="content-field management-panel content-video-field" key={field.key}>
          <div className="content-video-header">
            <Video />
            <div>
              <strong>{field.label}</strong>
              <small>Upload a video directly from your PC (MP4, WebM, MOV, OGG · max 100 MB) or paste a direct video URL. Leave empty to show the banner image.</small>
            </div>
          </div>
          <input
            ref={el => { videoInputRefs.current[field.key] = el; }}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogv,.ogg,.mov,.m4v"
            className="hidden"
            onChange={event => {
              const file = event.target.files?.[0];
              event.target.value = '';
              void handleVideoUpload(field.key, file);
            }}
          />
          {fieldValue ? (
            <div className="content-video-preview-wrap">
              <video key={fieldValue} src={fieldValue} controls muted playsInline className="content-video-preview" />
            </div>
          ) : (
            <button
              type="button"
              className="content-video-dropzone"
              disabled={isUploading || busy}
              onClick={() => videoInputRefs.current[field.key]?.click()}
            >
              {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
              <span>{isUploading ? `Uploading video… ${uploadProgress}%` : 'Click to upload hero video from your PC'}</span>
              <small>MP4 or WebM recommended for smooth background playback</small>
            </button>
          )}
          {isUploading && (
            <div className="content-upload-progress" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          <div className="content-video-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={isUploading || busy}
              onClick={() => videoInputRefs.current[field.key]?.click()}
            >
              {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
              {isUploading ? `Uploading… ${uploadProgress}%` : fieldValue ? 'Change Video from PC' : 'Upload Video from PC'}
            </button>
            {fieldValue && (
              <button
                type="button"
                className="secondary-button reject-button"
                disabled={isUploading || busy}
                onClick={() => {
                  setValues(current => { const next = { ...current }; delete next[field.key]; return next; });
                  setDirty(true);
                  setMessage('');
                }}
              >
                <Trash2 />
                Remove Video (Use Banner Image)
              </button>
            )}
          </div>
          <label className="content-video-url-label">
            <span>Or direct video URL (optional)</span>
            <input
              type="text"
              placeholder="https://example.com/hero-video.mp4"
              value={fieldValue}
              maxLength={15000}
              onChange={event => { setValues(current => ({ ...current, [field.key]: event.target.value })); setDirty(true); setMessage(''); }}
            />
          </label>
        </div>;
      }
      return <label className="content-field management-panel" key={field.key}><strong>{field.label}</strong>{field.type === 'image' && <small>Enter a complete image URL, or leave empty to keep the bundled image.</small>}{['url','email','image'].includes(field.type) ? <input type={field.type === 'email' ? 'email' : 'url'} value={fieldValue} maxLength={15000} onChange={event => { setValues(current => ({ ...current, [field.key]: event.target.value })); setDirty(true); setMessage(''); }} /> : <textarea rows={field.value.length > 250 ? 6 : 2} value={fieldValue} maxLength={15000} onChange={event => { setValues(current => ({ ...current, [field.key]: event.target.value })); setDirty(true); setMessage(''); }} />}<button type="button" className="content-restore" onClick={() => { setValues(current => { const next = { ...current }; delete next[field.key]; return next; }); setDirty(true); }}>Restore Default</button></label>;
    })}</div></fieldset><div className="content-save-bar"><span>{dirty ? 'Unpublished changes' : 'All changes published'}</span><button type="button" className="secondary-button" disabled={busy || uploadingField !== null} onClick={() => { if (!dirty || window.confirm('Discard your unpublished changes?')) void load(); }}>Reload / Discard</button><button className="primary-button" disabled={busy || uploadingField !== null || !dirty}>{busy ? 'Publishing…' : 'Publish Changes'}</button></div></form>}
  </section>;
}
