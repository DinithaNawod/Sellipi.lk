import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import catalog from '../../shared/siteContent.json';
import { fetchSiteContent, saveSiteContent, getApiErrorMessage } from '../services/api';
import { useSiteContent } from '../context/SiteContentContext';

const groups = [...new Set(catalog.map(field => field.group))];
export default function AdminContent() {
  const { refresh } = useSiteContent();
  const [values, setValues] = useState<Record<string,string>>({});
  const [revision, setRevision] = useState(0);
  const [group, setGroup] = useState('Contact details');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
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
  return <section className="site-content-editor"><div className="section-heading"><div><p className="admin-eyebrow">WEBSITE CONTENT</p><h1>Site Content & Contact Details</h1><p>Edit public descriptions, headings, links, and images. Publishing applies changes across the website.</p></div><Link className="secondary-button" to="/">View Website</Link></div>
    <p>Manage inscription descriptions, translations, locations, and images in <Link to="/admin/inscriptions">Inscriptions</Link>. Manage account access in <Link to="/admin/users">User Management</Link>.</p>
    <div className="management-filters"><label>Section<select value={group} onChange={event => setGroup(event.target.value)}>{groups.map(name => <option key={name}>{name}</option>)}</select></label><label className="management-search"><input aria-label="Search content" placeholder="Search fields in this section" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
    {error && <p className="inline-alert" role="alert">{error}</p>}{message && <p className="note-success" role="status">{message}</p>}
    {loading ? <p role="status">Loading site content…</p> : <form onSubmit={event => { event.preventDefault(); void save(); }}><fieldset disabled={busy}><div className="content-fields">{catalog.filter(field => field.group === group && (field.label + field.value).toLowerCase().includes(search.toLowerCase())).map(field => <label className="content-field management-panel" key={field.key}><strong>{field.label}</strong>{field.type === 'image' && <small>Enter a complete image URL, or leave empty to keep the bundled image.</small>}{['url','email','image'].includes(field.type) ? <input type={field.type === 'email' ? 'email' : 'url'} value={values[field.key] ?? field.value} maxLength={15000} onChange={event => { setValues(current => ({ ...current, [field.key]: event.target.value })); setDirty(true); setMessage(''); }} /> : <textarea rows={field.value.length > 250 ? 6 : 2} value={values[field.key] ?? field.value} maxLength={15000} onChange={event => { setValues(current => ({ ...current, [field.key]: event.target.value })); setDirty(true); setMessage(''); }} />}<button type="button" className="content-restore" onClick={() => { setValues(current => { const next = { ...current }; delete next[field.key]; return next; }); setDirty(true); }}>Restore Default</button></label>)}</div></fieldset><div className="content-save-bar"><span>{dirty ? 'Unpublished changes' : 'All changes published'}</span><button type="button" className="secondary-button" disabled={busy} onClick={() => { if (!dirty || window.confirm('Discard your unpublished changes?')) void load(); }}>Reload / Discard</button><button className="primary-button" disabled={busy || !dirty}>{busy ? 'Publishing…' : 'Publish Changes'}</button></div></form>}
  </section>;
}
