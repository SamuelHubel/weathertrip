
// component to return a trip
// includes start and end locations and route info from OSRM API
import geocodingService from '../services/geocodingService';
import routingService from '../services/routingService';

const getTrip = (req, res) => {
    const { start, end } = req.body;
    // geocode start and end locations
    const startLocation = geocodingService.geocode(start);
    const endLocation = geocodingService.geocode(end);
    if (!startLocation || !endLocation) {
        return res.status(400).json({ error: 'Invalid start or end location' });
    }
    // get route from OSRM API
    const route = routingService.getRoute(startLocation, endLocation);
    if (!route) {
        return res.status(400).json({ error: 'No route found' });
    }
    // return trip info
    res.json({
        start: {
            name: startLocation.display_name,
            lat: startLocation.lat,
            lon: startLocation.lon
        },
        end: {
            name: endLocation.display_name,
            lat: endLocation.lat,
            lon: endLocation.lon
        },
        route
    });



}

export default getTrip;