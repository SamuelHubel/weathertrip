// module to get weather data from openmeteo API
// takes lat/lon as input and returns current weather info
// will be used a lot as we ping weather for some points along the route
// every 50 miles or so, and also for start and end locations
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const getWeather = async (lat, lon) => {
    try {

        // url in .env
        const url = `${process.env.WEATHER_URL}?latitude=${lat}&longitude=${lon}&current_weather=true`;
        console.log(`Fetching weather from: ${url}`);
        const response = await axios.get(url, {
            temperature: temperature,
            windspeed: windspeed,
            weathercode: weathercode,
            precipitation: precipitation,
            snowfall: snowfall,
            rain: rain,
            

        }

        );
        return response.data;
    } catch (error) {
        console.error('Weather error:', error.message);
        return null;
    }
}

export default getWeather;