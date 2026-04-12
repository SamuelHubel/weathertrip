import React, { useState } from 'react';
import './tripMap.css';
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

// markers for weather points
const weatherIcons = {
  0: '☀️',   // Clear sky
  1: '🌤️',   // Mainly clear
  2: '⛅',    // Partly cloudy
  3: '☁️',    // Overcast
  45: '🌫️',   // Fog
  48: '🌫️',   // Depositing rime fog
  51: '🌦️',   // Drizzle: Light
  53: '🌦️',   // Drizzle: Moderate
  55: '🌦️',   // Drizzle: Dense
  56: '🌧️',   // Freezing Drizzle: Light
  57: '🌧️',   // Freezing Drizzle: Dense
  61: '🌧️',   // Rain: Slight
  63: '🌧️',   // Rain: Moderate
  65: '🌧️',   // Rain: Heavy
  66: '🌨️',   // Freezing Rain: Light
  67: '🌨️',   // Freezing Rain: Heavy
  71: '🌨️',   // Snow fall: Slight
  73: '🌨️',   // Snow fall: Moderate
  75: '🌨️',   // Snow fall: Heavy
  77: '🌨️',   // Snow grains
  80: '🌧️',   // Rain showers: Slight
  81: '🌧️',   // Rain showers: Moderate
  82: '🌧️',   // Rain showers: Violent
  85: '🌨️',   // Snow showers slight
  86: '🌨️',   // Snow showers heavy
  95: '⛈️',   // Thunderstorm: Slight or moderate 
  96: '⛈️',   // Thunderstorm with slight hail
  99: '⛈️',   // Thunderstorm with heavy hail
  // thunderstorm with hail only available in forecast for central Europe
}; 



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
            {/* Weather points along the route */}
            {trip?.weather?.map((point, idx) => (
              <Marker
                key={idx}
                position={[point.location.latitude, point.location.longitude]}
                icon={L.divIcon({
                  className: 'weather-icon',
                  html: weatherIcons[point.weathercode] || '❓',
                })}
              >
                <Popup>
                  <div><strong>Weather Point {idx + 1}</strong></div>
                  <div>Temp: {point.temperature}°C</div>
                  <div>Wind: {point.windspeed} m/s</div>
                  <div>Rain: {point.rain} mm</div>
                  <div>Snow: {point.snowfall} cm</div>
                </Popup>
              </Marker>
            ))}
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