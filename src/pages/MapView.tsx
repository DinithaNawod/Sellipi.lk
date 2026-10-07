import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';
import { fetchInscriptions } from '../services/api';
import type { Inscription } from '../services/api';
import { formatLocation } from '../utils/formatters';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapView() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInscriptions({ limit: 500 })
      .then((res) => setInscriptions(res.inscriptions))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const mapped = inscriptions.filter(
    (i) => i.location.coordinates.lat !== null && i.location.coordinates.lng !== null
  );

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <span className="text-sm">Loading map…</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center text-red-600">
          <AlertCircle className="w-8 h-8 mb-3" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      {/* Header */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-700" />
              Inscription Map
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              {mapped.length} of {inscriptions.length} inscription{inscriptions.length !== 1 ? 's' : ''} have GPS coordinates
            </p>
          </div>
          {mapped.length < inscriptions.length && (
            <p className="text-xs text-stone-400 max-w-xs text-right">
              Add latitude & longitude in the admin dashboard to show more inscriptions on the map.
            </p>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 min-h-[60vh]">
        <MapContainer
          center={[7.8731, 80.7718]} // Centre of Sri Lanka
          zoom={8}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mapped.map((ins) => (
            <Marker
              key={ins._id}
              position={[ins.location.coordinates.lat!, ins.location.coordinates.lng!]}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <p className="font-semibold text-stone-800 text-sm leading-snug mb-1">{ins.title}</p>
                  {ins.scriptType && (
                    <span className="inline-block text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded mb-1">
                      {ins.scriptType}
                    </span>
                  )}
                  <p className="text-xs text-stone-500 mb-2">
                    {formatLocation(ins.location)}
                    {ins.historicalPeriod && ` · ${ins.historicalPeriod}`}
                  </p>
                  <Link
                    to={`/inscription/${ins._id}`}
                    className="text-xs text-amber-700 font-medium underline hover:no-underline"
                  >
                    View inscription →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </main>
  );
}
