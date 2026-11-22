import { useState, useEffect, useMemo, useRef } from 'react';
import { Save, X, Upload, Trash2, ScanText, Languages, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { Inscription, InscriptionFormData } from '../services/api';
import { uploadInscriptionImage, runOcr, translateInscription, getApiErrorMessage } from '../services/api';
import { SCRIPT_TYPES } from '../utils/formatters';

interface Props {
  initial?: Inscription | null;
  onSubmit: (data: InscriptionFormData, imageFile?: File | null) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  onImageUploaded?: (id: string, imageUrl: string, imageProcessedUrl: string) => void;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];
const ACCEPTED_IMAGE_EXTS = /\.(jpe?g|png|webp|tiff?|bmp)$/i;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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

function AiButton({
  onClick,
  status,
  label,
  loadingLabel,
  icon,
  disabled,
}: {
  onClick: () => void;
  status: AiStatus;
  label: string;
  loadingLabel: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
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
}

export default function InscriptionForm({ initial, onSubmit, onCancel, isSubmitting, onImageUploaded }: Props) {
  const [form, setForm] = useState<InscriptionFormData>(emptyForm());
  const [processedImageUrl, setProcessedImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<AiStatus>('idle');
  const [ocrStatus, setOcrStatus] = useState<AiStatus>('idle');
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [translateStatus, setTranslateStatus] = useState<AiStatus>('idle');
  const [aiError, setAiError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // The inscription id is available only in edit mode
  const inscriptionId = initial?._id ?? null;

  const localPreviewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : ''),
    [selectedFile]
  );

  useEffect(() => {
    if (!localPreviewUrl) return;
    return () => URL.revokeObjectURL(localPreviewUrl);
  }, [localPreviewUrl]);

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
    setSelectedFile(null);
    setIsDragging(false);
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
    await onSubmit(form, selectedFile);
  };

  const processSelectedFile = async (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type) && !ACCEPTED_IMAGE_EXTS.test(file.name)) {
      setAiError('Unsupported file format. Please choose a JPG, PNG, WEBP, TIFF, or BMP image.');
      setUploadStatus('error');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setAiError('Image is too large. Maximum file size is 10 MB.');
      setUploadStatus('error');
      return;
    }

    setAiError('');

    if (!inscriptionId) {
      // Create mode: keep the file locally and upload automatically when the inscription is created
      setSelectedFile(file);
      setForm((prev) => ({ ...prev, imageUrl: '' }));
      setProcessedImageUrl('');
      setUploadStatus('idle');
      return;
    }

    // Edit mode: upload & process immediately so OCR can run right away
    setUploadStatus('loading');
    try {
      const result = await uploadInscriptionImage(inscriptionId, file);
      setSelectedFile(null);
      setForm((prev) => ({ ...prev, imageUrl: result.imageUrl }));
      setProcessedImageUrl(result.imageProcessedUrl);
      setUploadStatus('done');
      onImageUploaded?.(inscriptionId, result.imageUrl, result.imageProcessedUrl);
    } catch (err: unknown) {
      setAiError(getApiErrorMessage(err, 'Upload failed'));
      setUploadStatus('error');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processSelectedFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploadStatus === 'loading') return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    setProcessedImageUrl('');
    setUploadStatus('idle');
    setAiError('');
    if (fileRef.current) fileRef.current.value = '';
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
      setAiError(getApiErrorMessage(err, 'OCR failed'));
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
      setAiError(getApiErrorMessage(err, 'Translation failed'));
      setTranslateStatus('error');
    }
  };

  const isEditMode = !!inscriptionId;
  const displayImageUrl = localPreviewUrl || form.imageUrl;
  const inputCls = 'w-full px-3 py-2 text-sm border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-white';
  const labelCls = 'block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!isEditMode && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Save the inscription first, then re-open it to use AI features (OCR, auto-translate).</span>
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

      {/* Image — direct upload from PC */}
      <div>
        <label className={labelCls}>Image</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/tiff,image/bmp"
          className="hidden"
          onChange={handleUpload}
        />
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className="space-y-2"
        >
          {!displayImageUrl && !processedImageUrl ? (
            <button
              type="button"
              disabled={uploadStatus === 'loading'}
              onClick={() => fileRef.current?.click()}
              className={`w-full flex flex-col items-center justify-center gap-1.5 px-4 py-6 border-2 border-dashed rounded-lg transition-colors text-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/70 text-amber-800'
                  : 'border-stone-300 bg-stone-50/60 hover:border-amber-500 hover:bg-amber-50/40 text-stone-600'
              }`}
            >
              {uploadStatus === 'loading' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-amber-700" />
                  <span className="text-sm font-medium text-stone-700">Uploading &amp; processing image…</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-amber-700" />
                  <span className="text-sm font-medium text-stone-700">
                    Click to upload an image from your PC
                  </span>
                  <span className="text-xs text-stone-400">
                    or drag and drop here (JPG, PNG, WEBP, TIFF, BMP · max 10 MB)
                  </span>
                </>
              )}
            </button>
          ) : (
            <div
              className={`border rounded-lg p-3 space-y-3 transition-colors ${
                isDragging ? 'border-amber-500 bg-amber-50/40' : 'border-stone-200 bg-stone-50/40'
              }`}
            >
              <div className="flex gap-3">
                {displayImageUrl && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-400 mb-1">Original</p>
                    <img
                      src={displayImageUrl}
                      alt="Original"
                      className="h-32 w-full object-cover rounded border border-stone-200 bg-white"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                {processedImageUrl && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-400 mb-1">Processed (enhanced)</p>
                    <img
                      src={processedImageUrl}
                      alt="Processed"
                      className="h-32 w-full object-cover rounded border border-stone-200 bg-white"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-xs text-stone-500 truncate min-w-0">
                  {selectedFile ? (
                    <span>
                      <strong className="text-stone-700 font-medium">{selectedFile.name}</strong>{' '}
                      ({formatFileSize(selectedFile.size)}) · Ready to upload on save
                    </span>
                  ) : processedImageUrl ? (
                    <span className="text-green-600 font-medium">Processed image ready</span>
                  ) : (
                    <span className="text-green-600 font-medium">Image uploaded</span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <AiButton
                    onClick={() => fileRef.current?.click()}
                    status={uploadStatus}
                    label="Change Image"
                    loadingLabel="Uploading…"
                    icon={<Upload className="w-3.5 h-3.5" />}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={uploadStatus === 'loading'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-200 rounded hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
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
              min={-90}
              max={90}
              aria-label="Latitude"
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
              min={-180}
              max={180}
              aria-label="Longitude"
              onChange={(e) => setLocation('lng', e.target.value)}
              className={inputCls}
              placeholder="e.g. 80.5087"
            />
          </div>
        </div>
      </fieldset>

      <p className="text-xs text-stone-500">For an accurate site marker, find the site in Google Maps, right-click its position, and copy the latitude (first number) and longitude (second number) into the Location fields. Save the inscription to update its public map.</p>
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
          disabled={isSubmitting || uploadStatus === 'loading'}
          className="flex items-center gap-1.5 px-5 py-2 text-sm bg-amber-700 text-white rounded hover:bg-amber-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving…' : initial ? 'Save Changes' : 'Create Inscription'}
        </button>
      </div>
    </form>
  );
}
