// module to get weather data from openmeteo API
// takes lat/lon as input and returns current weather info
// will be used a lot as we ping weather for some points along the route
// every 50 miles or so, and also for start and end locations
import axios from 'axios';



// function to get weather data for a provided lat/lon from Open-Meteo API
// returns an object with current weather info and hourly precipitation, rain, snowfall for available hours
// will be called for each sampled point along the route
const getWeather = async (lat, lon) => {
    // check to make sure lat/lon are valid numbers before making API call
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
        console.error(`Invalid coordinates: lat=${lat}, lon=${lon}`);
        return null;
    }

    try {
        const { data } = await axios.get("https://api.open-meteo.com/v1/forecast", {
            params: new URLSearchParams([
        ['latitude', lat],
        ['longitude', lon],
        ['current', 'temperature_2m'],
        ['current', 'wind_speed_10m'],
        ['current', 'weather_code'],
        ['hourly', 'precipitation'],
        ['hourly', 'rain'],
        ['hourly', 'snowfall'],
        ['forecast_days', '1'],
        ])
    });
   // console.log('RAW DATA:', JSON.stringify(data, null, 2));
     return {
        location: { latitude: data.latitude, longitude: data.longitude },
        temperature: data.current?.temperature_2m,
        windspeed: data.current?.wind_speed_10m,
        weathercode: data.current?.weather_code,
        precipitation: data.hourly?.precipitation?.[0],
        rain: data.hourly?.rain?.[0],
        snowfall: data.hourly?.snowfall?.[0],
    };

    } catch (error) {
        console.error('Weather error:', error.message);
        console.error('Weather details:', error.response?.data); 
        return null;
    }
};

export default getWeather;