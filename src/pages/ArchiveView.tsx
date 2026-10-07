import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, LayoutGrid } from 'lucide-react';
import { fetchInscriptions, fetchFilterOptions } from '../services/api';
import type { Inscription, FilterOptions, PaginatedResponse } from '../services/api';
import InscriptionCard from '../components/InscriptionCard';
import FilterSidebar from '../components/FilterSidebar';
import type { ActiveFilters } from '../components/FilterSidebar';
import Pagination from '../components/Pagination';

const EMPTY_FILTERS: ActiveFilters = {
  search: '',
  location: '',
  historicalPeriod: '',
  scriptType: '',
};

const EMPTY_OPTIONS: FilterOptions = { locations: [], periods: [], scripts: [] };

export default function ArchiveView() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse['pagination']>({
    total: 0, page: 1, limit: 12, pages: 0,
  });
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [options, setOptions] = useState<FilterOptions>(EMPTY_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 350);
    return () => clearTimeout(t);
  }, [filters.search]);

  const loadOptions = useCallback(async () => {
    try {
      const opts = await fetchFilterOptions();
      setOptions(opts);
    } catch {
      // Non-critical, swallow
    }
  }, []);

  const loadInscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchInscriptions({
        search: debouncedSearch,
        location: filters.location,
        historicalPeriod: filters.historicalPeriod,
        scriptType: filters.scriptType,
        page,
        limit: 12,
      });
      setInscriptions(result.inscriptions);
      setPagination(result.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inscriptions');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.location, filters.historicalPeriod, filters.scriptType, page]);

  useEffect(() => { loadOptions(); }, [loadOptions]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filters.location, filters.historicalPeriod, filters.scriptType]);
  useEffect(() => { loadInscriptions(); }, [loadInscriptions]);

  const handleFilterChange = (updated: Partial<ActiveFilters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-800 flex items-center gap-2">
          <LayoutGrid className="w-6 h-6 text-amber-700" />
          Inscription Archive
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Browse and search the digital collection of ancient Sri Lankan inscriptions.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <FilterSidebar
          filters={filters}
          options={options}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          totalResults={pagination.total}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <span className="text-sm">Loading inscriptions…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-600">
              <AlertCircle className="w-8 h-8 mb-3" />
              <span className="text-sm font-medium">{error}</span>
              <button
                onClick={loadInscriptions}
                className="mt-3 text-xs underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          ) : inscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <LayoutGrid className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium text-stone-500">No inscriptions found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {inscriptions.map((ins) => (
                  <InscriptionCard key={ins._id} inscription={ins} />
                ))}
              </div>
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
