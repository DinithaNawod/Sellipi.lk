import { useState, useEffect, useRef } from 'react';
import { Save, X, Upload, ScanText, Languages, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { Inscription, InscriptionFormData } from '../services/api';
import { uploadInscriptionImage, runOcr, translateInscription } from '../services/api';
import { SCRIPT_TYPES } from '../utils/formatters';

interface Props {
  initial?: Inscription | null;
  onSubmit: (data: InscriptionFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const emptyForm = (): InscriptionFormData => ({
  title: '',
  description: '',
  imageUrl: '',
  location: { name: '', district: '', province: '', coordinates: { lat: null, lng: null } },
  historicalPeriod: '',
  scriptType: '',
  contentRaw: '',
  contentTranslated: '',
});

type AiStatus = 'idle' | 'loading' | 'done' | 'error';

export default function InscriptionForm({ initial, onSubmit, onCancel, isSubmitting }: Props) {
  const [form, setForm] = useState<InscriptionFormData>(emptyForm());
  const [processedImageUrl, setProcessedImageUrl] = useState('');
  const [uploadStatus, setUploadStatus] = useState<AiStatus>('idle');
  const [ocrStatus, setOcrStatus] = useState<AiStatus>('idle');
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [translateStatus, setTranslateStatus] = useState<AiStatus>('idle');
  const [aiError, setAiError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // The inscription id is available only in edit mode
  const inscriptionId = initial?._id ?? null;

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description,
        imageUrl: initial.imageUrl,
        location: { ...initial.location },
        historicalPeriod: initial.historicalPeriod,
        scriptType: initial.scriptType,
        contentRaw: initial.contentRaw,
        contentTranslated: initial.contentTranslated,
      });
      setProcessedImageUrl(initial.imageProcessedUrl || '');
    } else {
      setForm(emptyForm());
      setProcessedImageUrl('');
    }
    setUploadStatus('idle');
    setOcrStatus('idle');
    setTranslateStatus('idle');
    setAiError('');
    setOcrConfidence(null);
  }, [initial]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setLocation = (field: string, value: string | number | null) =>
    setForm((prev) => ({
      ...prev,
      location: field === 'lat' || field === 'lng'
        ? { ...prev.location, coordinates: { ...prev.location.coordinates, [field]: value === '' ? null : Number(value) } }
        : { ...prev.location, [field]: value },
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !inscriptionId) return;
    setUploadStatus('loading');
    setAiError('');
    try {
      const result = await uploadInscriptionImage(inscriptionId, file);
      setForm((prev) => ({ ...prev, imageUrl: result.imageUrl }));
      setProcessedImageUrl(result.imageProcessedUrl);
      setUploadStatus('done');
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Upload failed');
      setUploadStatus('error');
    }
  };

  const handleOcr = async () => {
    if (!inscriptionId) return;
    setOcrStatus('loading');
    setAiError('');
    try {
      const { text, confidence } = await runOcr(inscriptionId);
      setForm((prev) => ({ ...prev, contentRaw: text }));
      setOcrConfidence(confidence);
      setOcrStatus('done');
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'OCR failed');
      setOcrStatus('error');
    }
  };

  const handleTranslate = async () => {
    if (!inscriptionId) return;
    setTranslateStatus('loading');
    setAiError('');
    try {
      const { translation } = await translateInscription(inscriptionId, form.contentRaw);
      setForm((prev) => ({ ...prev, contentTranslated: translation }));
      setTranslateStatus('done');
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Translation failed');
      setTranslateStatus('error');
    }
  };

  const isEditMode = !!inscriptionId;
  const inputCls = 'w-full px-3 py-2 text-sm border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-white';
  const labelCls = 'block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1';

  const AiButton = ({
    onClick, status, label, loadingLabel, icon, disabled
  }: {
    onClick: () => void; status: AiStatus; label: string; loadingLabel: string;
    icon: React.ReactNode; disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={status === 'loading' || disabled}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-stone-300 rounded hover:bg-stone-50 text-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
    >
      {status === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {status === 'loading' ? loadingLabel : label}
      {status === 'done' && <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-0.5" />}
      {status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400 ml-0.5" />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!isEditMode && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Save the inscription first, then re-open it to use AI features (upload image, OCR, translate).</span>
        </div>
      )}

      {aiError && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {aiError}
        </div>
      )}

      {/* Title */}
      <div>
        <label className={labelCls}>Title <span className="text-red-400 normal-case">*</span></label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          className={inputCls}
          placeholder="e.g. Mihintale Rock Inscription"
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className={inputCls}
          placeholder="Brief description of the inscription…"
        />
      </div>

      {/* Image — URL or upload */}
      <div>
        <label className={labelCls}>Image</label>
        <div className="space-y-2">
          <input
            type="text"
            value={form.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
            className={inputCls}
            placeholder="Paste image URL, or upload a file below…"
          />
          {isEditMode && (
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/tiff,image/bmp"
                className="hidden"
                onChange={handleUpload}
              />
              <AiButton
                onClick={() => fileRef.current?.click()}
                status={uploadStatus}
                label="Upload & Process Image"
                loadingLabel="Processing…"
                icon={<Upload className="w-3.5 h-3.5" />}
              />
              {processedImageUrl && (
                <span className="text-xs text-green-600 font-medium">Processed image ready</span>
              )}
            </div>
          )}
          {/* Image preview */}
          {(form.imageUrl || processedImageUrl) && (
            <div className="flex gap-2 mt-1">
              {form.imageUrl && (
                <div className="flex-1">
                  <p className="text-xs text-stone-400 mb-1">Original</p>
                  <img
                    src={form.imageUrl}
                    alt="Original"
                    className="h-24 w-full object-cover rounded border border-stone-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              {processedImageUrl && (
                <div className="flex-1">
                  <p className="text-xs text-stone-400 mb-1">Processed (enhanced)</p>
                  <img
                    src={processedImageUrl}
                    alt="Processed"
                    className="h-24 w-full object-cover rounded border border-stone-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Location row */}
      <fieldset className="border border-stone-200 rounded-lg p-4">
        <legend className="text-xs font-semibold text-stone-500 uppercase tracking-wider px-1">Location</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <div>
            <label className={labelCls}>Site Name</label>
            <input
              type="text"
              value={form.location.name}
              onChange={(e) => setLocation('name', e.target.value)}
              className={inputCls}
              placeholder="e.g. Mihintale"
            />
          </div>
          <div>
            <label className={labelCls}>District</label>
            <input
              type="text"
              value={form.location.district}
              onChange={(e) => setLocation('district', e.target.value)}
              className={inputCls}
              placeholder="e.g. Anuradhapura"
            />
          </div>
          <div>
            <label className={labelCls}>Province</label>
            <input
              type="text"
              value={form.location.province}
              onChange={(e) => setLocation('province', e.target.value)}
              className={inputCls}
              placeholder="e.g. North Central"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className={labelCls}>Latitude</label>
            <input
              type="number"
              step="any"
              value={form.location.coordinates.lat ?? ''}
              onChange={(e) => setLocation('lat', e.target.value)}
              className={inputCls}
              placeholder="e.g. 8.3488"
            />
          </div>
          <div>
            <label className={labelCls}>Longitude</label>
            <input
              type="number"
              step="any"
              value={form.location.coordinates.lng ?? ''}
              onChange={(e) => setLocation('lng', e.target.value)}
              className={inputCls}
              placeholder="e.g. 80.5087"
            />
          </div>
        </div>
      </fieldset>

      {/* Period & Script row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Historical Period</label>
          <input
            type="text"
            value={form.historicalPeriod}
            onChange={(e) => set('historicalPeriod', e.target.value)}
            className={inputCls}
            placeholder="e.g. 3rd century BCE"
          />
        </div>
        <div>
          <label className={labelCls}>Script Type</label>
          <select
            value={form.scriptType}
            onChange={(e) => set('scriptType', e.target.value)}
            className={inputCls}
          >
            <option value="">Select script…</option>
            {SCRIPT_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Raw + OCR */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelCls}>Original Transcription (Raw Text)</label>
          {isEditMode && (
            <div className="flex items-center gap-2">
              {ocrConfidence !== null && ocrStatus === 'done' && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  ocrConfidence >= 70 ? 'bg-green-100 text-green-700' :
                  ocrConfidence >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {ocrConfidence}% confidence
                </span>
              )}
              <AiButton
                onClick={handleOcr}
                status={ocrStatus}
                label="Run OCR"
                loadingLabel="Running OCR…"
                icon={<ScanText className="w-3.5 h-3.5" />}
                disabled={!form.imageUrl && !processedImageUrl}
              />
            </div>
          )}
        </div>
        <textarea
          rows={4}
          value={form.contentRaw}
          onChange={(e) => set('contentRaw', e.target.value)}
          className={`${inputCls} font-mono`}
          placeholder="Transcribed text in original script…"
        />
      </div>

      {/* Translation + Auto-Translate */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelCls}>Translation (Modern Sinhala / English)</label>
          {isEditMode && (
            <AiButton
              onClick={handleTranslate}
              status={translateStatus}
              label="Auto-Translate"
              loadingLabel="Translating…"
              icon={<Languages className="w-3.5 h-3.5" />}
              disabled={!form.contentRaw.trim()}
            />
          )}
        </div>
        <textarea
          rows={5}
          value={form.contentTranslated}
          onChange={(e) => set('contentTranslated', e.target.value)}
          className={inputCls}
          placeholder="Modern translation of the inscription…"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50 text-stone-600 transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-5 py-2 text-sm bg-amber-700 text-white rounded hover:bg-amber-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving…' : initial ? 'Save Changes' : 'Create Inscription'}
        </button>
      </div>
    </form>
  );
}
