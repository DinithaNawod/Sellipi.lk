import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { FilterOptions } from '../services/api';

export interface ActiveFilters {
  search: string;
  location: string;
  historicalPeriod: string;
  scriptType: string;
}

interface Props {
  filters: ActiveFilters;
  options: FilterOptions;
  onFilterChange: (updated: Partial<ActiveFilters>) => void;
  onReset: () => void;
  totalResults: number;
}

export default function FilterSidebar({ filters, options, onFilterChange, onReset, totalResults }: Props) {
  const hasActiveFilters =
    filters.search || filters.location || filters.historicalPeriod || filters.scriptType;

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-stone-700 font-semibold text-sm">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear all
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              placeholder="Title, description…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-stone-50"
            />
          </div>
        </div>

        {/* Location */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">
            Location
          </label>
          <select
            value={filters.location}
            onChange={(e) => onFilterChange({ location: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-stone-50"
          >
            <option value="">All locations</option>
            {options.locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Historical Period */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">
            Era / Period
          </label>
          <select
            value={filters.historicalPeriod}
            onChange={(e) => onFilterChange({ historicalPeriod: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-stone-50"
          >
            <option value="">All periods</option>
            {options.periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Script Type */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">
            Script Type
          </label>
          <select
            value={filters.scriptType}
            onChange={(e) => onFilterChange({ scriptType: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-stone-50"
          >
            <option value="">All scripts</option>
            {options.scripts.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-3 border-t border-stone-100 text-xs text-stone-500 text-center">
          {totalResults} inscription{totalResults !== 1 ? 's' : ''} found
        </div>
      </div>
    </aside>
  );
}
