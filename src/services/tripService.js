// function to fetch trip data from the server backend
// takes start and end locations as input and returns trip info including route geometry
import axios from 'axios';
import {getToken} from './authService.js'; // for attaching token to authenticated requests
import getWeather from './weatherService.js';

// use either the env var for API URL or default to localhost for development
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeader = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}



const fetchTrip = async (startLocation, endLocation, extraBody = {}) => {
    // send POST request to server with start and end locations
    // errors reach the caller, so it can show the user what went wrong
    const response = await axios.post(`${BASE_URL}/api/trip`,
        // setting start and end to the raw location strings instead of geocoded lat/lon, since server will handle geocoding
        { start: startLocation, end: endLocation, ...extraBody },
        { headers: authHeader() }
    );
    // weather is fetched from the browser so Open-Meteo's per-IP limit is this user's own
    // null when it could not be loaded, so the frontend does not report an all-clear
    const { weatherPoints, ...trip } = response.data;
    // returns the trip data
    // locations, route, weather
    return { ...trip, weather: await getWeather(weatherPoints) };
};

const fetchTripLog = async (tokenOverride) => {
    try {
        const token = tokenOverride || getToken();
        if (!token) {
            return [];
        }
        const response = await axios.get(`${BASE_URL}/api/trip`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching logged trips:', error);
        return [];
    }
};

// names one of the signed-in user's saved trips
const renameTrip = (id, name) =>
    axios.patch(`${BASE_URL}/api/trip/${id}`, { name }, { headers: authHeader() });

export default fetchTrip;
export { fetchTripLog, renameTrip };