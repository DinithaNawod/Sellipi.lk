import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Clock, ScrollText, FileText,
  Languages, Loader2, AlertCircle, Calendar, Volume2, VolumeX, Image
} from 'lucide-react';
import { fetchInscriptionById } from '../services/api';
import type { Inscription } from '../services/api';
import { formatLocation, formatDate } from '../utils/formatters';
import { useTTS, type TTSLang } from '../hooks/useTTS';

const PLACEHOLDER_IMG = 'https://placehold.co/800x500/e7e5e4/78716c?text=No+Image+Available';

export default function DetailView() {
  const { id } = useParams<{ id: string }>();
  const [inscription, setInscription] = useState<Inscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProcessed, setShowProcessed] = useState(false);
  const [ttsLang, setTtsLang] = useState<TTSLang>('en-US');
  const { speak, stop, speaking, supported: ttsSupported } = useTTS();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchInscriptionById(id)
      .then(setInscription)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load inscription');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <span className="text-sm">Loading inscription…</span>
        </div>
      </main>
    );
  }

  if (error || !inscription) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center text-red-600">
          <AlertCircle className="w-8 h-8 mb-3" />
          <span className="text-sm font-medium">{error || 'Inscription not found'}</span>
          <Link to="/inscriptions" className="mt-3 text-xs text-stone-500 underline hover:no-underline">
            Back to archive
          </Link>
        </div>
      </main>
    );
  }

  const {
    title, description, imageUrl, imageProcessedUrl, location, historicalPeriod,
    scriptType, contentRaw, contentTranslated, createdAt
  } = inscription;
  const locationStr = formatLocation(location);
  const hasProcessed = !!imageProcessedUrl;
  const displayImage = showProcessed && hasProcessed ? imageProcessedUrl : imageUrl;

  const handleListen = () => {
    if (speaking) { stop(); return; }
    if (!contentTranslated) return;
    speak(contentTranslated, ttsLang);
  };

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/inscriptions"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Archive
      </Link>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        {/* Hero Image */}
        <div className="relative h-64 sm:h-80 bg-stone-100">
          <img
            src={displayImage || PLACEHOLDER_IMG}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
          />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {hasProcessed && (
              <button
                onClick={() => setShowProcessed((v) => !v)}
                title={showProcessed ? 'Show original image' : 'Show processed image'}
                className="flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/80 transition-colors"
              >
                <Image className="w-3.5 h-3.5" />
                {showProcessed ? 'Original' : 'Processed'}
              </button>
            )}
            {scriptType && (
              <span className="bg-amber-700/90 text-amber-50 text-sm font-medium px-3 py-1 rounded-full">
                {scriptType}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Title & meta row */}
          <div className="flex flex-wrap gap-3 mb-2">
            {historicalPeriod && (
              <span className="flex items-center gap-1 text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full border border-stone-200">
                <Clock className="w-3 h-3" />
                {historicalPeriod}
              </span>
            )}
            {locationStr !== 'Location unknown' && (
              <span className="flex items-center gap-1 text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full border border-stone-200">
                <MapPin className="w-3 h-3" />
                {locationStr}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-800 mb-3 leading-snug">
            {title}
          </h1>

          {description && (
            <p className="text-stone-600 text-base leading-relaxed mb-6 border-b border-stone-100 pb-6">
              {description}
            </p>
          )}

          {/* Detail grid */}
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <MetaBlock icon={<MapPin className="w-4 h-4" />} label="Location">
              <p>{location.name || '—'}</p>
              {location.district && <p className="text-stone-400">{location.district}, {location.province}</p>}
            </MetaBlock>
            <MetaBlock icon={<Clock className="w-4 h-4" />} label="Historical Period">
              <p>{historicalPeriod || '—'}</p>
            </MetaBlock>
            <MetaBlock icon={<ScrollText className="w-4 h-4" />} label="Script Type">
              <p>{scriptType || '—'}</p>
            </MetaBlock>
            <MetaBlock icon={<Calendar className="w-4 h-4" />} label="Catalogued">
              <p>{formatDate(createdAt)}</p>
            </MetaBlock>
          </div>

          {/* Transcription */}
          {contentRaw && (
            <Section icon={<FileText className="w-5 h-5 text-amber-700" />} title="Original Transcription">
              <pre className="whitespace-pre-wrap font-mono text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded-lg p-4 leading-relaxed">
                {contentRaw}
              </pre>
            </Section>
          )}

          {/* Translation + TTS */}
          {contentTranslated && (
            <Section icon={<Languages className="w-5 h-5 text-amber-700" />} title="Translation">
              <p className="text-stone-700 leading-relaxed bg-amber-50/60 border border-amber-100 rounded-lg p-4 whitespace-pre-line">
                {contentTranslated}
              </p>

              {ttsSupported && (
                <div className="flex items-center gap-3 mt-3">
                  <select
                    value={ttsLang}
                    onChange={(e) => setTtsLang(e.target.value as TTSLang)}
                    disabled={speaking}
                    className="text-xs border border-stone-300 rounded px-2 py-1.5 text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-white disabled:opacity-50"
                  >
                    <option value="en-US">English</option>
                    <option value="si-LK">සිංහල (Sinhala)</option>
                  </select>
                  <button
                    onClick={handleListen}
                    className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-full font-medium transition-colors ${
                      speaking
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    {speaking
                      ? <><VolumeX className="w-4 h-4" /> Stop</>
                      : <><Volume2 className="w-4 h-4" /> Listen</>
                    }
                  </button>
                </div>
              )}
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}

function MetaBlock({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <div className="text-stone-700 text-sm">{children}</div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-stone-700 mb-3">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}
