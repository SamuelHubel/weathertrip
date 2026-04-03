// module to get weather data from openmeteo API
// takes lat/lon as input and returns current weather info
// will be used a lot as we ping weather for some points along the route
// every 50 miles or so, and also for start and end locations
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
// function to get weather data for a provided lat/lon from Open-Meteo API
// returns an object with current weather info and hourly precipitation, rain, snowfall for available hours
// will be called for each sampled point along the route
const getWeather = async (lat, lon) => {
    try {
        const url = `${process.env.WEATHER_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation,rain,snowfall`;

        const response = await axios.get(url);

        const data = response.data;

        return {
            location: {
                latitude: data.latitude,
                longitude: data.longitude,
            },
            temperature: data.current_weather?.temperature,
            windspeed: data.current_weather?.windspeed,
            weathercode: data.current_weather?.weathercode,

            // hourly arrays
            // need to find current hour index to get current precipitation, rain, snowfall
            precipitation: data.hourly?.precipitation?.[0],
            rain: data.hourly?.rain?.[0],
            snowfall: data.hourly?.snowfall?.[0],
        };

    } catch (error) {
        console.error('Weather error:', error.message);
        return null;
    }
};

export default getWeather;