// module to get weather data from openmeteo API
// takes the points sampled along a route and returns current weather info for each one
// runs in the browser: Open-Meteo's free limit is per IP, and the server's shared host IP ran out of it
import axios from 'axios';

// rain + showers in mm, one decimal; a downpour can be all showers
const sumRain = (rain, showers) => Number(((rain ?? 0) + (showers ?? 0)).toFixed(1));

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
                ['wind_speed_unit', 'ms'],
                // 10 or fewer variables, so each point counts as one call against the limit
                // no "current" block: the hourly entry for this hour stands in for it
                // hourly window so the client can flag severe weather from the recent past and near future
                ...['temperature_2m', 'weather_code', 'rain', 'showers', 'snowfall', 'wind_speed_10m'].map((field) => ['hourly', field]),
                ['past_hours', '6'],
                ['forecast_hours', '12'],
                // today's sunrise/sunset at each point, so the client can draw that spot's sky
                ['daily', 'sunrise'],
                ['daily', 'sunset'],
                // "today" is each point's local day; times stay epoch below
                ['timezone', 'auto'],
                // epoch seconds, so the client needs no timezone handling
                ['timeformat', 'unixtime'],
            ]),
            timeout: 10000,
        });
        const nowSec = Date.now() / 1000;
        // Open-Meteo returns a list for several points but a single object for one
        return [].concat(data).map((point) => {
            const hourly = (point.hourly?.time ?? []).map((time, i) => {
                const rain = sumRain(point.hourly.rain?.[i], point.hourly.showers?.[i]);
                const snowfall = point.hourly.snowfall?.[i];
                return {
                    time: time * 1000,
                    temperature: point.hourly.temperature_2m?.[i],
                    weathercode: point.hourly.weather_code?.[i],
                    // water equivalent: Open-Meteo counts 7 cm of snow as 10 mm
                    precipitation: Number((rain + (snowfall ?? 0) / 0.7).toFixed(1)),
                    rain,
                    snowfall,
                    windspeed: point.hourly.wind_speed_10m?.[i],
                };
            });
            // the hour we are in now: the last one that has started
            const times = point.hourly?.time ?? [];
            const nowIndex = times.findLastIndex((time) => time <= nowSec);
            const current = hourly[nowIndex] ?? hourly[0];
            return {
                location: { latitude: point.latitude, longitude: point.longitude },
                temperature: current?.temperature,
                windspeed: current?.windspeed,
                weathercode: current?.weathercode,
                precipitation: current?.precipitation,
                rain: current?.rain,
                snowfall: current?.snowfall,
                // epoch ms; null where the sun doesn't rise or set today (polar day/night)
                sun: point.daily?.sunrise?.[0] && point.daily?.sunset?.[0]
                    ? { sunrise: point.daily.sunrise[0] * 1000, sunset: point.daily.sunset[0] * 1000 }
                    : null,
                // same field names as the current conditions, one entry per hour
                hourly,
            };
        });
    } catch (error) {
        console.error('Weather error:', error.message);
        console.error('Weather details:', error.response?.data);
        return null;
    }
};

export default getWeather;
