import type { InscriptionLocation } from '../services/api';

export const formatLocation = (location: InscriptionLocation): string => {
  const parts = [location.name, location.district, location.province].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Location unknown';
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
};

export const SCRIPT_TYPES = ['Brahmi', 'Ancient Sinhala', 'Grantha', 'Tamil Brahmi', 'Proto-Sinhala', 'Other'] as const;
