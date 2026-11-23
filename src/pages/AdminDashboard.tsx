import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, LayoutDashboard, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  fetchInscriptions,
  createInscription,
  updateInscription,
  deleteInscription,
  uploadInscriptionImage,
  getApiErrorMessage,
} from '../services/api';
import type { Inscription, InscriptionFormData } from '../services/api';
import InscriptionForm from '../components/InscriptionForm';
import { formatLocation, formatDate } from '../utils/formatters';

type Modal = 'none' | 'create' | 'edit' | 'delete';

const PAGE_SIZE = 50;

const getVisiblePages = (current: number, totalPages: number): (number | 'ellipsis')[] => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const items: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) items.push('ellipsis');
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push('ellipsis');
  items.push(totalPages);
  return items;
};

export default function AdminDashboard() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>('none');
  const [selected, setSelected] = useState<Inscription | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Live debounced search
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === searchQuery) return;
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearchQuery(trimmed);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, searchQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInscriptions({
        page,
        limit: PAGE_SIZE,
        ...(searchQuery ? { search: searchQuery } : {}),
      });
      const totalPages = Math.max(1, res.pagination.pages);
      if (page > totalPages && res.pagination.total > 0) {
        setPage(totalPages);
        return;
      }
      setInscriptions(res.inscriptions);
      setTotal(res.pagination.total);
      setPages(totalPages);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => { load(); }, [load]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    setPage(1);
    setSearchQuery(trimmed);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  const goToPage = (nextPage: number) => {
    const clamped = Math.min(Math.max(1, nextPage), pages);
    if (clamped === page) return;
    setPage(clamped);
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startIndex = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, total);

  const openCreate = () => { setSelected(null); setFormError(null); setModal('create'); };
  const openEdit = (ins: Inscription) => { setSelected(ins); setFormError(null); setModal('edit'); };
  const openDelete = (ins: Inscription) => { setSelected(ins); setDeleteError(null); setModal('delete'); };
  const closeModal = () => { setModal('none'); setSelected(null); };

  const handleImageUploaded = (id: string, imageUrl: string, imageProcessedUrl: string) => {
    setInscriptions((prev) =>
      prev.map((ins) => (ins._id === id ? { ...ins, imageUrl, imageProcessedUrl } : ins))
    );
  };

  const handleFormSubmit = async (data: InscriptionFormData, imageFile?: File | null) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (modal === 'create') {
        const created = await createInscription(data);
        if (imageFile) {
          try {
            await uploadInscriptionImage(created._id, imageFile);
          } catch (uploadErr: unknown) {
            setSelected(created);
            setModal('edit');
            load();
            setFormError(
              `Inscription created, but image upload failed: ${getApiErrorMessage(uploadErr, 'Upload failed')}`
            );
            return;
          }
        }
      } else if (modal === 'edit' && selected) {
        await updateInscription(selected._id, data);
      }
      closeModal();
      if (modal === 'create' && page !== 1) {
        setPage(1);
      } else {
        load();
      }
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err, 'Operation failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    setDeleteError(null);
    try {
      await deleteInscription(selected._id);
      closeModal();
      load();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showForm = modal === 'create' || modal === 'edit';

  return (
    <section ref={sectionRef} className="catalogue-management">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-amber-700" />
            Inscription Management
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {searchQuery
              ? `${total} matching record${total !== 1 ? 's' : ''} for "${searchQuery}".`
              : `Manage the inscription catalogue — ${total} record${total !== 1 ? 's' : ''} total.`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white text-sm font-medium rounded hover:bg-amber-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Inscription
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            aria-label="Search inscriptions"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, inscription number, publication, language, site, district, period, or script…"
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-600 shadow-xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 text-sm font-medium bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
        >
          Search
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="px-3.5 py-2.5 text-sm font-medium border border-stone-200 bg-white text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Reset
          </button>
        )}
      </form>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-stone-400">
            <Loader2 className="w-7 h-7 animate-spin mr-2" />
            Loading…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-600">
            <AlertCircle className="w-7 h-7 mb-2" />
            <span className="text-sm">{error}</span>
            <button onClick={load} className="mt-2 text-xs underline">Retry</button>
          </div>
        ) : inscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <p className="text-sm">
              {searchQuery ? `No inscriptions found matching "${searchQuery}".` : 'No inscriptions yet.'}
            </p>
            {searchQuery ? (
              <button
                onClick={clearSearch}
                className="mt-3 text-sm text-amber-700 underline hover:no-underline"
              >
                Clear search
              </button>
            ) : (
              <button
                onClick={openCreate}
                className="mt-3 text-sm text-amber-700 underline hover:no-underline"
              >
                Add the first one
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-left">
                    <th className="px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider w-12">#</th>
                    <th className="px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider hidden md:table-cell">Location</th>
                    <th className="px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider hidden lg:table-cell">Period</th>
                    <th className="px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider hidden lg:table-cell">Script / Language</th>
                    <th className="px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider hidden sm:table-cell">Added</th>
                    <th className="px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {inscriptions.map((ins, idx) => (
                    <tr key={ins._id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 text-stone-400 text-xs tabular-nums">
                        {startIndex + idx}
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-800 max-w-xs">
                        <span className="line-clamp-1">{ins.title}</span>
                        {(ins.inscriptionNumber || ins.publication) && (
                          <span className="block text-xs font-normal text-stone-400 line-clamp-1 mt-0.5">
                            {[ins.inscriptionNumber && `No. ${ins.inscriptionNumber}`, ins.publication].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-500 hidden md:table-cell">
                        {formatLocation(ins.location) !== 'Location unknown' ? formatLocation(ins.location) : '—'}
                      </td>
                      <td className="px-4 py-3 text-stone-500 hidden lg:table-cell">
                        {ins.historicalPeriod || '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap items-center gap-1">
                          {ins.scriptType ? (
                            <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded">
                              {ins.scriptType}
                            </span>
                          ) : null}
                          {ins.language ? (
                            <span className="inline-block bg-stone-100 text-stone-700 text-xs px-2 py-0.5 rounded">
                              {ins.language}
                            </span>
                          ) : null}
                          {!ins.scriptType && !ins.language && '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-400 text-xs hidden sm:table-cell whitespace-nowrap">
                        {formatDate(ins.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(ins)}
                            title="Edit"
                            className="p-1.5 rounded text-stone-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDelete(ins)}
                            title="Delete"
                            className="p-1.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination (50 per page) */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-600">
              <span>
                Showing <strong className="text-stone-800">{startIndex}–{endIndex}</strong> of{' '}
                <strong className="text-stone-800">{total}</strong> record{total !== 1 ? 's' : ''} (50 per page)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-stone-300 rounded hover:bg-stone-100 text-stone-700 disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                {getVisiblePages(page, pages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-stone-400">…</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => goToPage(item)}
                      aria-current={item === page ? 'page' : undefined}
                      className={`min-w-[30px] px-2 py-1.5 rounded border font-medium transition-colors ${
                        item === page
                          ? 'bg-amber-700 border-amber-700 text-white'
                          : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= pages}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-stone-300 rounded hover:bg-stone-100 text-stone-700 disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-stone-800">
                {modal === 'create' ? 'Add New Inscription' : 'Edit Inscription'}
              </h2>
              <button onClick={closeModal} className="text-stone-400 hover:text-stone-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {formError && (
                <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}
              <InscriptionForm
                initial={modal === 'edit' ? selected : null}
                onSubmit={handleFormSubmit}
                onCancel={closeModal}
                isSubmitting={isSubmitting}
                onImageUploaded={handleImageUploaded}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-semibold text-stone-800 mb-1">Delete Inscription</h2>
                <p className="text-sm text-stone-600">
                  Are you sure you want to delete{' '}
                  <span className="font-medium">"{selected.title}"</span>?
                  This action cannot be undone.
                </p>
              </div>
            </div>
            {deleteError && (
              <p className="text-sm text-red-600 mb-3">{deleteError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50 text-stone-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60 transition-colors font-medium"
              >
                {isSubmitting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
