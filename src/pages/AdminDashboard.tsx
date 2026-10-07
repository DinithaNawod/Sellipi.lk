import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, LayoutDashboard, X } from 'lucide-react';
import {
  fetchInscriptions,
  createInscription,
  updateInscription,
  deleteInscription,
} from '../services/api';
import type { Inscription, InscriptionFormData } from '../services/api';
import InscriptionForm from '../components/InscriptionForm';
import { formatLocation, formatDate } from '../utils/formatters';

type Modal = 'none' | 'create' | 'edit' | 'delete';

export default function AdminDashboard() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>('none');
  const [selected, setSelected] = useState<Inscription | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInscriptions({ limit: 100 });
      setInscriptions(res.inscriptions);
      setTotal(res.pagination.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setSelected(null); setFormError(null); setModal('create'); };
  const openEdit = (ins: Inscription) => { setSelected(ins); setFormError(null); setModal('edit'); };
  const openDelete = (ins: Inscription) => { setSelected(ins); setDeleteError(null); setModal('delete'); };
  const closeModal = () => { setModal('none'); setSelected(null); };

  const handleFormSubmit = async (data: InscriptionFormData) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (modal === 'create') {
        await createInscription(data);
      } else if (modal === 'edit' && selected) {
        await updateInscription(selected._id, data);
      }
      closeModal();
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Operation failed');
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
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-amber-700" />
            Admin Dashboard
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Manage the inscription catalogue — {total} record{total !== 1 ? 's' : ''} total.
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
            <p className="text-sm">No inscriptions yet.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-sm text-amber-700 underline hover:no-underline"
            >
              Add the first one
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-left">
                  <th className="px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider hidden md:table-cell">Location</th>
                  <th className="px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider hidden lg:table-cell">Period</th>
                  <th className="px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider hidden lg:table-cell">Script</th>
                  <th className="px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider hidden sm:table-cell">Added</th>
                  <th className="px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inscriptions.map((ins) => (
                  <tr key={ins._id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-stone-800 max-w-xs">
                      <span className="line-clamp-1">{ins.title}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden md:table-cell">
                      {formatLocation(ins.location) !== 'Location unknown' ? formatLocation(ins.location) : '—'}
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden lg:table-cell">
                      {ins.historicalPeriod || '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {ins.scriptType ? (
                        <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded">
                          {ins.scriptType}
                        </span>
                      ) : '—'}
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
    </main>
  );
}
