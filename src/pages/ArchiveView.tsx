import { useSiteContent } from '../context/SiteContentContext';
import { useState, useEffect, type FormEvent } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { fetchInscriptions, fetchFilterOptions, getApiErrorMessage } from '../services/api';
import type { Inscription, FilterOptions, FilterParams } from '../services/api';
import PageHero from '../components/PageHero';
import InscriptionCard from '../components/InscriptionCard';
import Pagination from '../components/Pagination';
import banner from '../assets/reference/archive-banner.jpg';
const empty = { search: '', location: '', historicalPeriod: '', scriptType: '' };
export default function ArchiveView() {
  const { value, image } = useSiteContent();
  const [draft, setDraft] = useState(empty);
  const [query, setQuery] = useState<FilterParams>({ ...empty, page: 1, limit: 10 });
  const [options, setOptions] = useState<FilterOptions>({ locations: [], periods: [], scripts: [] });
  const [records, setRecords] = useState<Inscription[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => { let active = true; fetchFilterOptions().then(value => { if (active) setOptions(value); }).catch(() => {}); return () => { active = false; }; }, []);
  useEffect(() => {
    let active = true;
    fetchInscriptions(query).then(value => { if (active) { setRecords(value.inscriptions); setTotal(value.pagination.total); setError(''); } }).catch(err => { if (active) setError(getApiErrorMessage(err, 'Unable to load inscriptions.')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, retry]);
  function search(event: FormEvent) { event.preventDefault(); setLoading(true); setQuery({ ...draft, page: 1, limit: query.limit }); }
  function clear() { setDraft(empty); setLoading(true); setQuery({ ...empty, page: 1, limit: query.limit }); }
  const pagination = <Pagination page={query.page ?? 1} pages={Math.ceil(total / (query.limit ?? 10))} total={total} limit={query.limit} onPageChange={page => { setLoading(true); setQuery(prev => ({ ...prev, page })); }} onLimitChange={limit => { setLoading(true); setQuery(prev => ({ ...prev, page: 1, limit })); }} />;
  return <main className="archive-page"><PageHero title={value("archive_title")} image={image("archive_banner", banner)} /><form onSubmit={search} className="advanced-search content-width"><h2>Advanced Search</h2><div className="search-fields">
    <label>Publication<select disabled title="Publication metadata is not available in the current archive"><option>Select Publication</option></select></label>
    <label>Site<select value={draft.location} onChange={event => setDraft(prev => ({ ...prev, location: event.target.value }))}><option value="">Select Site</option>{options.locations.map(value => <option key={value}>{value}</option>)}</select></label>
    <label>Inscription Number <small>(contains)</small><input value={draft.search} onChange={event => setDraft(prev => ({ ...prev, search: event.target.value }))} placeholder="Enter Inscription Number or Keyword" /></label>
    <label>Period<select value={draft.historicalPeriod} onChange={event => setDraft(prev => ({ ...prev, historicalPeriod: event.target.value }))}><option value="">Select Period</option>{options.periods.map(value => <option key={value}>{value}</option>)}</select></label>
    <label>Language<select disabled title="Language metadata is not available in the current archive"><option>Select Language</option></select></label>
    <label>Script<select value={draft.scriptType} onChange={event => setDraft(prev => ({ ...prev, scriptType: event.target.value }))}><option value="">Select Script</option>{options.scripts.map(value => <option key={value}>{value}</option>)}</select></label>
  </div><div className="search-buttons"><button className="primary-button" type="submit">Search</button><button className="primary-button light-button" type="button" onClick={clear}>Clear</button></div><p className="metadata-hint">Publication and language filters will be available when that metadata is recorded.</p></form>
  {pagination}<section className="archive-results content-width" aria-live="polite">{loading ? <div className="state-message"><Loader2 className="animate-spin" />Loading inscriptions…</div> : error ? <div className="state-message error-message"><AlertCircle /><p>{error}</p><button className="primary-button" onClick={() => { setLoading(true); setRetry(value => value + 1); }}>Try Again</button></div> : records.length ? records.map(item => <InscriptionCard key={item._id} inscription={item} />) : <div className="state-message"><h2>No inscriptions found</h2><p>Try another search or clear the filters.</p></div>}</section>{pagination}</main>;
}
