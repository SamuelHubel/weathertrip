// function to fetch trip data from the server backend
// takes start and end locations as input and returns trip info including route geometry
import axios from 'axios';


const fetchTrip = async (startLocation, endLocation) => {
    try {
        // send POST request to server with start and end locations
        const response = await axios.post('http://localhost:5000/api/trip', { 
            // setting start and end to the raw location strings instead of geocoded lat/lon, since server will handle geocoding
            start: startLocation, 
            end: endLocation,

        });

        // returns the trip data
        // locations, route, weather
        return response.data;
    } catch (error) {
        console.error('Error fetching trip data:', error);
        return null;
    }
};

export default fetchTrip;