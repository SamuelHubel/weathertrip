
// component to return a trip
// includes start and end locations and route info from OSRM API
import geocodingService from '../services/geocodingService.js';
import getRoute from '../services/routingService.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';

// a place is a typed name, or a saved one ({ location, lat, lon }) sent back when replaying a trip
const isPlace = (place) => typeof place === 'string'
    ? place.length <= 200
    : typeof place?.location === 'string' && place.location.length <= 200
        && Number.isFinite(place.lat) && Math.abs(place.lat) <= 90
        && Number.isFinite(place.lon) && Math.abs(place.lon) <= 180;

// a saved place already has coordinates, so it skips the 1 req/s geocoding queue
const locate = (place) => typeof place === 'string'
    ? geocodingService.geocodeLocation(place)
    : { lat: place.lat, lon: place.lon, name: place.location };

const getTrip = async (req, res) => {
    try {
        const { start, end } = req.body ?? {};
        
        if (!start || !end) {
            console.error('Missing start or end location in request body');
            return res.status(400).json({ error: 'Missing start or end location' });
        }
        
        if (![start, end].every(isPlace)) {
            return res.status(400).json({ error: 'Invalid start or end location' });
        }

        // optional stops between start and end, in driving order
        const { stops = [] } = req.body;
        if (!Array.isArray(stops) || stops.length > 8 || !stops.every(isPlace)) {
            return res.status(400).json({ error: 'Invalid stop location' });
        }
        const stopNames = stops.map((place) => (typeof place === 'string' ? place.trim() : place)).filter(Boolean);

        // geocode start and end locations
        const startLocation = await locate(start);
        const endLocation = await locate(end);
        if (!startLocation || !endLocation) {
            return res.status(400).json({ error: 'Invalid start or end location' });
        }
        const stopLocations = [];
        for (const place of stopNames) stopLocations.push(await locate(place));
        if (stopLocations.some((location) => !location)) {
            return res.status(400).json({ error: 'Invalid stop location' });
        }
        // get route from OSRM API, through every stop
        const route = await getRoute([startLocation, ...stopLocations, endLocation]);
        if (!route) {
            return res.status(400).json({ error: 'No route found' });
        }


        // if the user is logged in, save the trip to their trip history
        // id of the saved trip, so the signed-in user can name it
        let savedId;
        if (req.user && req.body.save !== false) {
            // trip object to be saved to database
            const tripData = new Trip({
                userId: req.user.id, // reference to the User model
                start: {
                    location: startLocation.name ?? start.trim(), // geocoder's place name, for display in the trip log
                    lat: startLocation.lat,
                    lon: startLocation.lon
                },
                stops: stopLocations.map((location, i) => ({
                    location: location.name ?? stopNames[i],
                    lat: location.lat,
                    lon: location.lon
                })),
                end: {
                    location: endLocation.name ?? end.trim(), // geocoder's place name, for display in the trip log
                    lat: endLocation.lat, 
                    lon: endLocation.lon
                },
                // the route line is not stored: replaying a trip fetches it again
                route: {
                    distance: route.distance,
                    duration: route.duration,
                },
            });

            // a failed save must not throw away the trip the user is waiting for
            try {
                // a token outlives a deleted account (up to 7 days); don't leave trips nobody can delete
                if (await User.exists({ _id: req.user.id })) {
                    await tripData.save();
                    savedId = tripData._id;
                }
            } catch (error) {
                console.error('Trip save failed:', error.message);
            }
        }
        // return trip info
        // returns 
        // start: {lat lon}
        // end: {lat lon}
        // route: {distance, duration, geometry}
        // weatherPoints
        res.json({
            start: {
                
                lat: startLocation.lat,
                lon: startLocation.lon
            },
            stops: stopLocations.map(({ lat, lon }) => ({ lat, lon })),
            end: {
                lat: endLocation.lat,
                lon: endLocation.lon
            },
            route: {
                distance: route.distance,
                duration: route.duration,
                geometry: route.geometry,            
            },
            // [lat, lon] pairs sampled every ~50 miles; the browser fetches their weather
            // so Open-Meteo's per-IP limit is each user's, not this server's shared host IP
            weatherPoints: route.weatherPoints,
            id: savedId,
        });

    } 
   catch (error) {
    // name the upstream service, so a 429 or timeout says which provider failed
    // host only: the OSRM path holds the user's coordinates
    console.error('CATCH ERROR:', error.message, error.config?.url?.match(/^[a-z]+:\/\/[^/]+/i)?.[0] ?? '');
    // public OSRM/Nominatim throttle shared host IPs; tell the user to retry rather than report a bug
    if (error.response?.status === 429) {
        return res.status(503).json({ error: 'Map services are busy, try again in a minute' });
    }
    res.status(500).json({ error: 'Failed to process trip' });
    }
}

export default getTrip;