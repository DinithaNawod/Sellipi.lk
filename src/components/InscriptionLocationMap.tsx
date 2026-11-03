import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import type { Inscription } from '../services/api';
import { formatLocation } from '../utils/formatters';
import { locationMapLinks } from '../utils/mapLocation';
import markerUrl from 'leaflet/dist/images/marker-icon.png';
import markerRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

const markerIcon = new Icon({ iconUrl: markerUrl, iconRetinaUrl: markerRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
export default function InscriptionLocationMap({ record }: { record: Inscription }) {
  const [tileError, setTileError] = useState(false);
  const { coordinates, search, directions } = locationMapLinks(record.location);
  return <section className="inscription-location" aria-labelledby="inscription-location-title"><div className="location-map-heading"><div><h2 id="inscription-location-title"><MapPin aria-hidden="true" />Site Location</h2><p>{formatLocation(record.location)}</p></div><div className="location-map-links">{search && <a className="secondary-button" href={search} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" />{coordinates ? 'Open in Google Maps' : 'Search site in Google Maps'}</a>}{directions && <a className="primary-button" href={directions} target="_blank" rel="noreferrer"><Navigation aria-hidden="true" />Get Directions</a>}</div></div>
    {coordinates ? <><div className="inscription-map-frame"><MapContainer key={coordinates.join(',')} center={coordinates} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' eventHandlers={{ tileerror: () => setTileError(true) }} /><Marker position={coordinates} icon={markerIcon}><Popup><strong>{record.title}</strong><br />{formatLocation(record.location)}</Popup></Marker></MapContainer></div><p className="location-coordinate-caption">Saved site coordinates: {coordinates[0]}, {coordinates[1]}. Zoom in or select the marker for details.</p>{tileError && <p role="status" className="form-status">Some map tiles could not load. Check your connection or use Open in Google Maps.</p>}</> : <p className="location-map-empty">Exact coordinates have not been recorded for this inscription. An administrator can add latitude and longitude in Dashboard → Inscriptions → Edit.{search && ' The search link uses the site name; it does not identify a verified position.'}</p>}
  </section>;
}
