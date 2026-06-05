# Weather.Trip

A road trip weather web application that visualizes weather conditions along a driving route. Enter an origin and destination, and the app calculates your route and displays live weather forecasts at regular intervals along the way — so you know what conditions to expect before you hit the road.


---

## Features

- **Route planning** — enter any origin and destination (city names, addresses, etc.)
- **Weather along the route** — current temperature, wind speed, precipitation, snowfall, and weather conditions fetched every ~50 miles
- **Interactive map** — dark-themed Leaflet map with a rendered polyline and clickable weather markers
- **Trip log** — authenticated users can save trips and replay them from the sidebar
- **User accounts** — register and log in to persist your trip history across sessions

---

## Tech Stack

**Frontend**
- React 19 + Vite
- React Leaflet / Leaflet.js (map rendering)
- Axios (HTTP client)

**Backend**
- Node.js + Express
- MongoDB + Mongoose (trip/user storage)
- JWT + bcrypt (authentication)

**External APIs**
- [Open-Meteo](https://open-meteo.com/) — free weather forecasts (no API key required)
- [OSRM](http://project-osrm.org/) — open-source routing engine
- [Nominatim](https://nominatim.org/) — OpenStreetMap geocoding
- [Stadia Maps](https://stadiamaps.com/) — map tiles

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- MongoDB instance (local or Atlas)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/weathertrip.git
cd weathertrip
```

**2. Install frontend dependencies**

```bash
npm install
```

**3. Install backend dependencies**

```bash
cd server
npm install
```

### Running the App

**Start the backend** (from `server/`):

```bash
npm start
```

**Start the frontend** (from the project root):

```bash
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
weathertrip/
├── src/                        # React frontend
│   ├── components/
│   │   ├── TripInput.jsx       # Origin/destination form
│   │   ├── TripMap.jsx         # Leaflet map with route + weather markers
│   │   ├── TripLog.jsx         # Saved trip history sidebar
│   │   ├── WeatherEvents.jsx   # Notable weather events panel (coming soon)
│   │   └── authModal.jsx       # Login/register modal
│   ├── services/
│   │   ├── tripService.js      # API calls for trip planning + log
│   │   └── authService.js      # Login, register, token management
│   └── App.jsx
│
├── server/                     # Node/Express backend
│   ├── controllers/
│   │   ├── tripController.js   # Trip planning logic
│   │   ├── logController.js    # Trip log retrieval
│   │   └── authController.js  # Register/login
│   ├── services/
│   │   ├── geocodingService.js    # Nominatim geocoding
│   │   ├── routingService.js      # OSRM route fetching
│   │   ├── routeSamplingService.js # Haversine-based route sampling
│   │   └── weatherService.js      # Open-Meteo weather fetching
│   ├── models/
│   │   ├── Trip.js
│   │   └── User.js
│   ├── routes/
│   │   ├── tripRoutes.js
│   │   └── authRoutes.js
│   └── server.js
│
└── vite.config.js
```

---

## Testing

**Frontend tests** (Vitest + React Testing Library, from project root):

```bash
npm run test:run
```

**Backend tests** (Vitest, from `server/`):

```bash
npm test
```

Test coverage spans geocoding, routing, route sampling, weather fetching, the trip controller, and key frontend components.

---

## Roadmap

- [ ] Notable weather events panel (alerts, storms, road hazards)
- [ ] Time-aware forecasts (predict weather at each stop based on estimated arrival time)
- [ ] Multi-stop trip planning
- [ ] Precipitation risk heat overlay on map
- [ ] Trip sharing

---

## License

MIT