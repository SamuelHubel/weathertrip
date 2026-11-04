import React, { useEffect } from 'react';
import './tripMap.css';
import PointName from './PointName';
import { MapContainer, TileLayer, Polyline, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { weatherIcons } from '../sky';
import { toF, toMph, mmToIn, cmToIn } from '../units';

const startIcon = L.divIcon({ className: 'pin pin-start', iconSize: [16, 16] });
const endIcon = L.divIcon({ className: 'pin pin-end', iconSize: [16, 16] });

const PHONE = '(max-width: 700px)';

// frame a newly plotted route clear of the floating panels
function FitRoute({ geometry }) {
  const map = useMap();
  useEffect(() => {
    if (!geometry?.length) return;
    const phone = window.matchMedia?.(PHONE).matches;
    map.fitBounds(geometry, phone
      ? { paddingTopLeft: [20, 90], paddingBottomRight: [20, 180] }
      : { paddingTopLeft: [400, 60], paddingBottomRight: [420, 60] });
  }, [map, geometry]);
  return null;
}

function FlyTo({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lon != null) map.flyTo([lat, lon], Math.max(map.getZoom(), 8), { duration: 0.8 });
  }, [map, lat, lon]);
  return null;
}

function TripMap({ trip, time, selected, onSelect }) {
  const tiles = time === 'night' ? 'alidade_smooth_dark' : 'alidade_smooth';
  const focus = selected != null ? trip?.weather?.[selected]?.location : null;

  return (
    <div className="map-wrapper">
      <MapContainer center={[39.8, -98.6]} zoom={4} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          key={tiles}
          attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={`https://tiles.stadiamaps.com/tiles/${tiles}/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_STADIA_API_KEY}`}
        />

        <ZoomControl position="bottomleft" />
        <FitRoute geometry={trip?.route?.geometry} />
        <FlyTo lat={focus?.latitude} lon={focus?.longitude} />

        {trip?.route?.geometry && (
          <Polyline positions={trip.route.geometry} pathOptions={{ className: 'route-line', weight: 5 }} />
        )}

        {trip?.start?.lat && (
          <Marker position={[trip.start.lat, trip.start.lon]} icon={startIcon}>
            <Popup>Origin</Popup>
          </Marker>
        )}

        {trip?.end?.lat && (
          <Marker position={[trip.end.lat, trip.end.lon]} icon={endIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {trip?.weather?.map((point, idx) => point?.location && (
          <Marker
            key={idx}
            position={[point.location.latitude, point.location.longitude]}
            eventHandlers={{ click: () => onSelect?.(idx) }}
            icon={L.divIcon({
              className: `weather-icon${selected === idx ? ' selected' : ''}`,
              iconSize: [34, 34],
              html: weatherIcons[point.weathercode] || '❓',
            })}
          >
            <Popup>
              <div><strong>
                <PointName
                  lat={point.location.latitude}
                  lon={point.location.longitude}
                  fallback={`Stop ${idx + 1}`}
                />
              </strong></div>
              <div>{toF(point.temperature)} · Wind {toMph(point.windspeed)}</div>
              <div>Rain {mmToIn(point.rain)} · Snow {cmToIn(point.snowfall)}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default TripMap;
