// function to fetch trip data from the server backend
// takes start and end locations as input and returns trip info including route geometry
import axios from 'axios';
import {getToken} from './authService.js'; // for attaching token to authenticated requests


const authHeader = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}



const fetchTrip = async (startLocation, endLocation) => {
    try {
        // send POST request to server with start and end locations
        const response = await axios.post('http://localhost:5000/api/trip', 
            // setting start and end to the raw location strings instead of geocoded lat/lon, since server will handle geocoding
            { start: startLocation, end: endLocation,}, 
            { headers: authHeader()}
    );
        // returns the trip data
        // locations, route, weather
        return response.data;
    } catch (error) {
        console.error('Error fetching trip data:', error);
        return null;
    }
};

const fetchTripLog = async (tokenOverride) => {
    try {
        const token = tokenOverride || getToken();
        if (!token) {
            return [];
        }
        const response = await axios.get('http://localhost:5000/api/trip', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching logged trips:', error);
        return [];
    }
};


export default fetchTrip;
export { fetchTripLog, authHeader };