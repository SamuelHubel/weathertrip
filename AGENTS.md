# AGENTS.md
# Development outline
    Thanks ChatGPT
## Project Overview

This project is a **road trip weather web application** that visualizes weather conditions along a user-defined driving route.

Users enter:

* starting location
* destination
* optional stops

The application calculates a driving route and displays **weather forecasts at intervals along the route**.

The goal is to help users understand **weather risks and conditions across a potential road trip**.

---

# Core Architecture

The project follows a **JavaScript full-stack architecture**.

Frontend:

* React
* HTML
* CSS
* JavaScript

Backend:

* Node.js
* Express.js

Database:

* MongoDB (optional for caching trips)

External APIs:

* Open-Meteo (weather)
* OSRM (routing)
* Nominatim (geocoding)

---

# System Design

High-level flow:

1. User enters origin and destination
2. Frontend sends request to backend
3. Backend geocodes locations
4. Backend retrieves driving route
5. Route is sampled at intervals
6. Weather is fetched for each sampled coordinate
7. Results returned to frontend
8. Frontend renders route and weather markers on map

---

# Directory Structure

Recommended layout:

```
project-root
│
├── client/                 # React frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── services
│   │   └── App.jsx
│   └── package.json
│
├── server/                 # Node / Express backend
│   ├── controllers
│   ├── routes
│   ├── services
│   ├── models
│   └── server.js
│
├── shared                  # shared types/utilities
│
└── AGENTS.md
```

---

# Backend Responsibilities

The backend performs the following tasks:

### Geocoding

Convert user-provided location strings into coordinates.

API:
Nominatim

Output:

```
{
  "lat": 39.7392,
  "lon": -104.9903
}
```

---

### Route Calculation

Retrieve the driving route between origin and destination.

API:
OSRM

Output includes:

* polyline geometry
* distance
* duration

---

### Route Sampling

The route must be sampled at regular intervals.

Recommended interval:

```
30–50 miles
```

Each sampled coordinate becomes a **weather query point**.

Example:

```
[
 {lat, lon},
 {lat, lon},
 {lat, lon}
]
```

---

### Weather Fetching

For each sampled coordinate:

Request forecast data from Open-Meteo.

Relevant weather fields:

* temperature
* precipitation
* snowfall
* wind speed
* weather code

---

### Response Format

The backend should return:

```
{
 route: [coordinates],
 weatherPoints: [
   {
     lat,
     lon,
     temperature,
     precipitation,
     condition
   }
 ]
}
```

---

# Frontend Responsibilities

The React client should:

1. Provide trip input UI
2. Send trip request to backend
3. Render map
4. Display route
5. Show weather markers along route

---

### Map Rendering

Use a map library such as:

Leaflet or Mapbox GL.

Markers should display:

* temperature
* precipitation chance
* weather icon

---

# Caching Strategy (Optional)

To reduce API usage:

Cache previous trip requests.

Possible cache key:

```
origin + destination + date
```

Cache lifetime:

```
1–3 hours
```

MongoDB can be used for this.

---

# Error Handling

Agents should ensure the system handles:

* invalid locations
* routing failures
* weather API errors
* rate limiting

Frontend should show user-friendly error messages.

---

# Development Guidelines

### Code Style

* Use modern JavaScript (ES6+)
* Prefer async/await over promise chains
* Use modular service files

Example:

```
services/weatherService.js
services/routingService.js
```

---

### Environment Variables

Store API configuration in:

```
.env
```

Example:

```
PORT=5000
WEATHER_API_URL=https://api.open-meteo.com
```

---

# Suggested Milestones

### Phase 1

Basic UI

* trip input
* map rendering

---

### Phase 2

Routing

* geocoding
* route retrieval

---

### Phase 3

Weather integration

* route sampling
* weather requests

---

### Phase 4

Visualization

* route markers
* weather icons
* temperature display

---

### Phase 5

Enhancements

Optional features:

* precipitation risk visualization
* severe weather alerts
* time-of-arrival weather prediction
* trip sharing

---

# Performance Considerations

Avoid excessive weather requests.

Strategies:

* sample route sparsely
* batch requests when possible
* cache results

---

# Testing

Test cases should include:

* short routes
* long routes
* cross-state trips
* invalid inputs

---

# Future Extensions

Potential improvements:

* time-aware forecasts
* road hazard detection
* snow / ice warnings
* multi-day road trip planner
* offline route caching

---

# Summary

This application combines:

* route planning
* geospatial sampling
* weather forecasting
* interactive map visualization

The focus should remain on:

* clear API boundaries
* efficient route sampling
* responsive UI
* minimal API cost
