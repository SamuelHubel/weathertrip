
// component to return a trip
// includes start and end locations and route info from OSRM API
import geocodingService from '../services/geocodingService.js';
import getRoute from '../services/routingService.js';
import sampleRoute from '../services/routeSamplingService.js';

const getTrip = async (req, res) => {
    try {
        const { start, end } = req.body;
        console.log('Start:', start, 'End:', end);
        
        if (!start || !end) {
            console.error('Missing start or end location in request body');
            return res.status(400).json({ error: 'Missing start or end location' });
        }
        
        // geocode start and end locations
        const startLocation = await geocodingService.geocodeLocation(start);
        const endLocation = await geocodingService.geocodeLocation(end);
        if (!startLocation || !endLocation) {
            console.error(`Geocoding failed - start: ${startLocation}, end: ${endLocation}`);
            return res.status(400).json({ error: 'Invalid start or end location' });
        }
        // get route from OSRM API
        const route = await getRoute(startLocation, endLocation);
        if (!route) {
            return res.status(400).json({ error: 'No route found' });
        }
        // return trip info
        // returns 
        // start: {lat lon}
        // end: {lat lon}
        // route: {distance, duration, geometry}
        // convert geometry to polyline string for frontend rendering
        const coordPairs = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
        res.json({
            start: {
                lat: startLocation.lat,
                lon: startLocation.lon
            },
            end: {
                lat: endLocation.lat,
                lon: endLocation.lon
            },
            route: {
                distance: route.distance,
                duration: route.duration,
                geometry: coordPairs,
            }
        });
    } catch (error) {
        console.error('Trip error:', error);
        res.status(500).json({ error: 'Failed to process trip' });
    }
}

export default getTrip;