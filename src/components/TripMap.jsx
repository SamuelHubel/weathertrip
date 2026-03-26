import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';

function TripMap({ trip }) {
//

  return (
    <div>
      <h2>Map</h2>

      <MapContainer
        center={[39.8, -98.6]}
        zoom={4}
        style={{ height: '600px', width: '85%' }}
      >
        <TileLayer  
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* render route polyline if trip and route data is available */}
        {trip && trip.route && (
          <Polyline positions={trip.route.geometry} color="blue" />
        )}
        {/* render start and end markers if trip data is available */}
        {trip?.start?.lat && trip?.end?.lat && (
          <>
            <Marker position={[trip.start.lat, trip.start.lon]}>
              <Popup>Start Location</Popup>
            </Marker>

            <Marker position={[trip.end.lat, trip.end.lon]}>
              <Popup>End Location</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default TripMap;