import { useState, useRef, useEffect } from 'react';
import {
  Upload, ScanText, Languages, Loader2, AlertCircle, X,
  ImageUp, Copy, Check, Sparkles,
} from 'lucide-react';
import { translateImageFile, getApiErrorMessage } from '../services/api';
import type { ImageTranslateResult } from '../services/api';
import { SCRIPT_TYPES } from '../utils/formatters';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB — matches the server limit
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];

type Status = 'idle' | 'loading' | 'done' | 'error';

export default function TranslatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [scriptType, setScriptType] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImageTranslateResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState<'raw' | 'translation' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Revoke the object URL when the preview changes or the component unmounts
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const selectFile = (f: File | undefined) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError('Unsupported file type. Use JPG, PNG, WebP, TIFF or BMP.');
      return;
    }
    if (f.size > MAX_SIZE) {
      setError('Image is larger than 10 MB. Please choose a smaller file.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setStatus('idle');
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    selectFile(e.dataTransfer.files?.[0]);
  };

  const handleTranslate = async () => {
    if (!file) return;
    setStatus('loading');
    setError('');
    try {
      const data = await translateImageFile(file, scriptType);
      setResult(data);
      setStatus('done');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to process the image. Please try again.'));
      setStatus('error');
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
    setResult(null);
    setStatus('idle');
    setError('');
    setScriptType('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const copy = (text: string, which: 'raw' | 'translation') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const loading = status === 'loading';

  return (
    <main className="flex-1 font-poppins">
      {/* Hero */}
      <section className="bg-maroon text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="inline-flex items-center gap-2 text-amber-200 text-xs font-semibold uppercase tracking-widest mb-3">
            <Sparkles className="w-4 h-4" />
            AI-Powered Tool
          </div>
          <h1 className="font-display text-3xl sm:text-4xl mb-3">Translate an Inscription</h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base">
            Upload a photograph of an ancient Sri Lankan inscription. We enhance the image,
            read the script with OCR, and translate it into modern Sinhala and English.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Upload card */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 sm:p-8">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={(e) => selectFile(e.target.files?.[0])}
          />

          {!previewUrl ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-16 px-6 transition-colors ${
                dragActive
                  ? 'border-maroon bg-maroon/5'
                  : 'border-stone-300 hover:border-maroon/60 hover:bg-stone-50'
              }`}
            >
              <ImageUp className="w-10 h-10 text-maroon" />
              <span className="text-stone-700 font-medium">
                Drag &amp; drop an image here, or click to browse
              </span>
              <span className="text-xs text-stone-400">
                JPG, PNG, WebP, TIFF or BMP — up to 10 MB
              </span>
            </button>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <img
                  src={previewUrl}
                  alt="Selected inscription"
                  className="w-full sm:w-64 h-48 object-cover rounded-lg border border-stone-200"
                />
                <div className="flex-1 w-full space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-700 truncate">{file?.name}</p>
                      <p className="text-xs text-stone-400">
                        {file ? (file.size / 1024 / 1024).toFixed(2) : '0'} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={reset}
                      disabled={loading}
                      className="flex items-center gap-1 text-xs text-stone-500 hover:text-maroon transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Remove
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                      Script Type <span className="normal-case text-stone-400">(optional — improves translation)</span>
                    </label>
                    <select
                      value={scriptType}
                      onChange={(e) => setScriptType(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-maroon/40 focus:border-maroon bg-white disabled:opacity-60"
                    >
                      <option value="">Auto / Unknown</option>
                      {SCRIPT_TYPES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleTranslate}
                    disabled={loading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-maroon text-white rounded-lg hover:bg-maroon-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                    {loading ? 'Processing…' : 'Translate Inscription'}
                  </button>
                </div>
              </div>

              {loading && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-500 border-t border-stone-100 pt-4">
                  <span className="flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Enhancing image</span>
                  <span className="flex items-center gap-1.5"><ScanText className="w-3.5 h-3.5" /> Reading script (OCR)</span>
                  <span className="flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> Translating</span>
                  <span className="text-stone-400">This can take 15–40 seconds on first run.</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && status === 'done' && (
          <div className="space-y-6">
            {/* Images: original + enhanced */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <figure className="bg-white rounded-xl border border-stone-200 p-3">
                <img src={result.imageUrl} alt="Original" className="w-full h-56 object-contain rounded bg-stone-50" />
                <figcaption className="text-xs text-stone-400 mt-2 text-center">Original</figcaption>
              </figure>
              <figure className="bg-white rounded-xl border border-stone-200 p-3">
                <img src={result.imageProcessedUrl} alt="Enhanced for OCR" className="w-full h-56 object-contain rounded bg-stone-50" />
                <figcaption className="text-xs text-stone-400 mt-2 text-center">Enhanced for OCR</figcaption>
              </figure>
            </div>

            {/* Raw OCR text */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg text-stone-800 flex items-center gap-2">
                  <ScanText className="w-5 h-5 text-maroon" /> Detected Text
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    result.confidence >= 70 ? 'bg-green-100 text-green-700' :
                    result.confidence >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {result.confidence}% confidence
                  </span>
                  {result.text.trim() && (
                    <button
                      type="button"
                      onClick={() => copy(result.text, 'raw')}
                      className="flex items-center gap-1 text-xs text-stone-500 hover:text-maroon transition-colors"
                    >
                      {copied === 'raw' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === 'raw' ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
              <pre className="whitespace-pre-wrap font-sinhala text-base text-stone-800 bg-stone-50 rounded-lg p-4 min-h-16">
                {result.text.trim() || 'No text could be read from this image.'}
              </pre>
              {result.confidence < 40 && result.text.trim() && (
                <p className="text-xs text-amber-600 mt-2 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Low confidence is common with weathered stone. Try a sharper, well-lit, straight-on photo for better results.
                </p>
              )}
            </div>

            {/* Translation */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg text-stone-800 flex items-center gap-2">
                  <Languages className="w-5 h-5 text-maroon" /> Translation
                </h2>
                {result.translation.trim() && (
                  <button
                    type="button"
                    onClick={() => copy(result.translation, 'translation')}
                    className="flex items-center gap-1 text-xs text-stone-500 hover:text-maroon transition-colors"
                  >
                    {copied === 'translation' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === 'translation' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              {result.translation.trim() ? (
                <div className="whitespace-pre-wrap font-sinhala text-base leading-relaxed text-stone-800">
                  {result.translation}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {result.translationError || 'Translation is unavailable for this text.'}
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm border border-stone-300 rounded-lg hover:bg-white text-stone-600 transition-colors font-medium"
              >
                <ImageUp className="w-4 h-4" /> Translate another image
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
