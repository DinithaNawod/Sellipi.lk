import { Link } from 'react-router-dom';
import { MapPin, Clock, FileText } from 'lucide-react';
import type { Inscription } from '../services/api';
import { formatLocation, truncateText } from '../utils/formatters';

interface Props {
  inscription: Inscription;
}

const PLACEHOLDER_IMG = 'https://placehold.co/600x400/e7e5e4/78716c?text=No+Image';

export default function InscriptionCard({ inscription }: Props) {
  const { _id, title, description, imageUrl, location, historicalPeriod, scriptType } = inscription;
  const locationStr = formatLocation(location);

  return (
    <Link
      to={`/inscription/${_id}`}
      className="group flex flex-col bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative h-44 bg-stone-100 overflow-hidden">
        <img
          src={imageUrl || PLACEHOLDER_IMG}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
          }}
        />
        {scriptType && (
          <span className="absolute top-2 right-2 bg-amber-700/90 text-amber-50 text-xs font-medium px-2 py-0.5 rounded">
            {scriptType}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-semibold text-stone-800 text-base leading-snug group-hover:text-amber-800 transition-colors line-clamp-2">
          {title}
        </h3>

        {description && (
          <p className="text-stone-500 text-sm leading-relaxed line-clamp-2">
            {truncateText(description, 100)}
          </p>
        )}

        <div className="mt-auto pt-2 border-t border-stone-100 flex flex-col gap-1">
          {locationStr !== 'Location unknown' && (
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-stone-400" />
              <span className="truncate">{locationStr}</span>
            </div>
          )}
          {historicalPeriod && (
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Clock className="w-3.5 h-3.5 shrink-0 text-stone-400" />
              <span className="truncate">{historicalPeriod}</span>
            </div>
          )}
          {!locationStr.includes('unknown') && !historicalPeriod && (
            <div className="flex items-center gap-1.5 text-xs text-stone-400">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>View details</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
