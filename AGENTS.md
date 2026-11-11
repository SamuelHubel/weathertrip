# AGENTS.md

Road-trip weather app: enter a start, optional stops (up to 8) and an end; see the route and the weather along it.

## Flow

1. The browser POSTs place names to `server/` (`/api/trip`).
2. The server geocodes them (Nominatim, `server/services/geocodingService.js`), gets the route (OSRM, `routingService.js`)
   and samples a weather point every 80 km (`routeSamplingService.js`). Signed-in trips are saved to MongoDB.
3. The browser fetches the weather for those points from Open-Meteo (`src/services/weatherService.js`) and renders
   the map (`TripMap.jsx`) and the hazard timeline (`DriveSheet.jsx`).

## Decisions to keep

- Weather is fetched in the browser, not on the server: Open-Meteo's free limit is per IP, and the server's shared
  host IP ran out of it.
- Geocoding runs one request at a time, 1.1 s apart (Nominatim allows 1 req/s for the whole app). Replaying a saved
  trip sends its stored coordinates so it skips this queue.
- The server and hazard thresholds are metric; `src/units.js` converts to US units for display only.
- Don't log searched places or user ids: the privacy page (`public/privacy.html`) says guest searches are not stored.
- Shortcuts with a known limit are marked `shortcut:` in the code.

## Commands

- Frontend (repo root): `npm start`, `npm run test:run`
- Backend (`server/`): `npm start`, `npm test`
- CI (`.github/workflows/ci.yml`) runs both test suites on every push.
