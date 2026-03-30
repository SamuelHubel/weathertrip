import React, { useState } from 'react';
import './TripMap.css';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';

function formatDistance(meters) {
  if (!meters) return '—';
  const miles = meters / 1609.34;
  return `${miles.toFixed(0)} mi`;
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function TripMap({ trip }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="panel map-panel">
      {/* Panel Header */}
      <div className="panel-header" onClick={() => setOpen(o => !o)}>
        <span className="panel-icon">🗺</span>
        <span className="panel-title">Route Map</span>
        {/* able to open and close the map panel */}  
        <span className={`panel-toggle${open ? ' open' : ''}`}>▼</span>
      </div>

      {/* Panel Body */}
      <div className={`panel-body${open ? ' open' : ''}`}>
        <div className="map-wrapper">
          <MapContainer
            center={[39.8, -98.6]}
            zoom={4}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            />

            {trip?.route?.geometry && (
              <Polyline
                positions={trip.route.geometry}
                color="#00d4ff"
                weight={3}
                opacity={0.85}
              />
            )}

            {trip?.start?.lat && (
              <Marker position={[trip.start.lat, trip.start.lon]}>
                <Popup>ORIGIN</Popup>
              </Marker>
            )}

            {trip?.end?.lat && (
              <Marker position={[trip.end.lat, trip.end.lon]}>
                <Popup>DESTINATION</Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Empty state overlay */}
          {!trip && (
            <div className="map-empty-state">
              <div className="map-empty-icon">⊕</div>
              <div className="map-empty-text">Enter a route to begin</div>
            </div>
          )}
        </div>

        {/* Stat bar */}
        <div className="map-stat-bar">
          <div className="map-stat">
            <span className="map-stat-label">Distance</span>
            <span className="map-stat-value">{formatDistance(trip?.route?.distance)}</span>
          </div>
          <div className="map-stat">
            <span className="map-stat-label">Est. Drive</span>
            <span className="map-stat-value">{formatDuration(trip?.route?.duration)}</span>
          </div>
          <div className="map-stat">
            <span className="map-stat-label">Weather Points</span>
            <span className="map-stat-value">Coming soon...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripMap;