import type { InscriptionLocation } from '../services/api';

export function mapCoordinates(location?: InscriptionLocation | null): [number, number] | null {
  const lat = location?.coordinates?.lat;
  const lng = location?.coordinates?.lng;
  return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
}
export function locationMapLinks(location?: InscriptionLocation | null) {
  const coordinates = mapCoordinates(location);
  const name = [location?.name, location?.district, location?.province].filter(Boolean).join(', ');
  const destination = coordinates ? coordinates.join(',') : name ? `${name}, Sri Lanka` : '';
  return {
    coordinates,
    search: destination ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}` : '',
    directions: coordinates ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : '',
  };
}
