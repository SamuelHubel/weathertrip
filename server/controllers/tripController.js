
// component to return a trip
// includes start and end locations and route info from OSRM API
import geocodingService from '../services/geocodingService.js';
import getRoute from '../services/routingService.js';
import getWeather from '../services/weatherService.js';
import Trip from '../models/Trip.js';


const getTrip = async (req, res) => {
    try {
        const { start, end } = req.body ?? {};
        console.log('Start:', start, 'End:', end);
        
        if (!start || !end) {
            console.error('Missing start or end location in request body');
            return res.status(400).json({ error: 'Missing start or end location' });
        }
        
        if ([start, end].some((place) => typeof place !== 'string' || place.length > 200)) {
            return res.status(400).json({ error: 'Invalid start or end location' });
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


        // fetch weather for points in route.weatherPoints
        // this is an array of {lat, lon} points sampled along the route every ~50 miles
        // fetches the following data for each point:
        // location: {latitude, longitude}
        // temperature
        // windspeed
        // weathercode (Open-Meteo's numeric code for current weather conditions)
        // precipitation (mm) for current hour
        // rain (mm) for current hour
        // snowfall (cm) for current hour
        const weather = await getWeather(route.weatherPoints);
        // if the user is logged in, save the trip to their trip history
        if (req.user && req.body.save !== false) {
            // trip object to be saved to database
            const tripData = new Trip({
                userId: req.user.id, // reference to the User model
                start: {
                    location: start, // save the raw location string for display in the trip log
                    lat: startLocation.lat,
                    lon: startLocation.lon
                },
                end: {
                    location: end, // save the raw location string for display in the trip log
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
                await tripData.save();
                console.log(`Saved ${start} to ${end} for user ${req.user.id}`);
            } catch (error) {
                console.error('Trip save failed:', error.message);
            }
        } else {
            console.log('No user logged in, skipping trip save to database');
        }
        // return trip info
        // returns 
        // start: {lat lon}
        // end: {lat lon}
        // route: {distance, duration, geometry, weatherPoints}
        // weather for each point retrieved from 
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
                geometry: route.geometry,            
            },
            // weather data for each sampled point along the route
            // null when it could not be loaded, so the frontend does not report an all-clear
            weather: weather
        });

    } 
   catch (error) {
    console.log('CATCH ERROR:', error.message);
    res.status(500).json({ error: 'Failed to process trip' });
    }
}

export default getTrip;