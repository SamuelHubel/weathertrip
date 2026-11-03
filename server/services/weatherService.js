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
                ['current', 'showers'],
                ['current', 'snowfall'],
                ['wind_speed_unit', 'ms'],
                // hourly window so the client can flag severe weather from the recent past and near future
                ...['weather_code', 'precipitation', 'rain', 'showers', 'snowfall', 'wind_speed_10m'].map((field) => ['hourly', field]),
                ['past_hours', '6'],
                ['forecast_hours', '12'],
                // epoch seconds, so the client needs no timezone handling
                ['timeformat', 'unixtime'],
            ]),
            timeout: 10000,
        });
        // Open-Meteo returns a list for several points but a single object for one
        return [].concat(data).map((point) => ({
            location: { latitude: point.latitude, longitude: point.longitude },
            temperature: point.current?.temperature_2m,
            windspeed: point.current?.wind_speed_10m,
            weathercode: point.current?.weather_code,
            precipitation: point.current?.precipitation,
            // Open-Meteo reports showers separately, and a downpour can be all showers
            rain: point.current && Number(((point.current.rain ?? 0) + (point.current.showers ?? 0)).toFixed(1)),
            snowfall: point.current?.snowfall,
            // same field names as the current conditions, one entry per hour
            hourly: (point.hourly?.time ?? []).map((time, i) => ({
                time: time * 1000,
                weathercode: point.hourly.weather_code?.[i],
                precipitation: point.hourly.precipitation?.[i],
                rain: Number(((point.hourly.rain?.[i] ?? 0) + (point.hourly.showers?.[i] ?? 0)).toFixed(1)),
                snowfall: point.hourly.snowfall?.[i],
                windspeed: point.hourly.wind_speed_10m?.[i],
            })),
        }));
    } catch (error) {
        console.error('Weather error:', error.message);
        console.error('Weather details:', error.response?.data);
        return null;
    }
};

export default getWeather;
