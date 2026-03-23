// component to display map with trip route
// using react-leaflet for map display
import React from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
// leaflet stylesheet is imported in index.js

function TripMap() {
  return (
    <div>
      <h2>Map</h2>
      {/* map component goes here */}
      <MapContainer center={[39.8, -98.6]} zoom={4} style={{height: '600px', width: '85%'}}>
        <TileLayer  
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

      </MapContainer>
    
    </div>
  );
}


export default TripMap;