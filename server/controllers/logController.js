// function to return all logged trips from the database
import Trip from '../models/Trip.js';

const getLoggedTrips = async (req, res) => {
    try {
        const loggedTrips = await Trip.find().sort({ createdAt: -1 }); // sort by most recent descending order
        res.json(loggedTrips);
    } catch (error) {
        console.error('Error fetching logged trips:', error);
        res.status(500).json({ error: 'Failed to fetch logged trips' });
    }
};

export default getLoggedTrips;