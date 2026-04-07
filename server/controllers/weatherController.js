import getWeather from "../services/weatherService.js";


const getWeatherData = async (req, res) => {
    try {
        const { lat, lon } = req.body;
        const weatherData = await getWeather(lat, lon);

        return res.json({
            location:      weatherData.location,
            temperature:   weatherData.temperature,
            windspeed:     weatherData.windspeed,
            weathercode:   weatherData.weathercode,
            precipitation: weatherData.precipitation,
            rain:          weatherData.rain,
            snowfall:      weatherData.snowfall,
        });

    } catch (error) {
        console.error('Weather error:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
};

export default getWeatherData;