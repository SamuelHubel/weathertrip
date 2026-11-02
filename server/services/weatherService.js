// module to get weather data from openmeteo API
// takes the points sampled along a route and returns current weather info for each one
import axios from 'axios';

// one request covers every point, so a long trip does not make a call per point
// points is an array of [lat, lon] pairs
// returns an array with one weather object per point, or null if the weather could not be loaded
const getWeather = async (points) => {
    // check to make sure lat/lon are valid numbers before making API call
    if (!points?.length || points.some(([lat, lon]) => lat == null || lon == null || isNaN(lat) || isNaN(lon))) {
        console.error('Invalid coordinates:', points);
        return null;
    }

    try {
        const { data } = await axios.get("https://api.open-meteo.com/v1/forecast", {
            params: new URLSearchParams([
                ['latitude', points.map(([lat]) => Number(lat).toFixed(4)).join(',')],
                ['longitude', points.map(([, lon]) => Number(lon).toFixed(4)).join(',')],
                ['current', 'temperature_2m'],
                ['current', 'wind_speed_10m'],
                ['current', 'weather_code'],
                ['current', 'precipitation'],
                ['current', 'rain'],
                ['current', 'snowfall'],
                ['wind_speed_unit', 'ms'],
            ]),
        });
        // Open-Meteo returns a list for several points but a single object for one
        return [].concat(data).map((point) => ({
            location: { latitude: point.latitude, longitude: point.longitude },
            temperature: point.current?.temperature_2m,
            windspeed: point.current?.wind_speed_10m,
            weathercode: point.current?.weather_code,
            precipitation: point.current?.precipitation,
            rain: point.current?.rain,
            snowfall: point.current?.snowfall,
        }));
    } catch (error) {
        console.error('Weather error:', error.message);
        console.error('Weather details:', error.response?.data);
        return null;
    }
};

export default getWeather;
