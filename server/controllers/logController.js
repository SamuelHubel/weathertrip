// function to return all logged trips from the database
import Trip from '../models/Trip.js';

const getLoggedTrips = async (req, res) => {
    try {
        // If no user is logged in, return empty array instead of crashing
        if (!req.user) {
            console.log('No user logged in, returning empty trip log');
            return res.json([]);
        }
        console.log('fetching trips for user:', req.user.id);
        const loggedTrips = await Trip.find({ userId: req.user.id })
                                      .sort({ createdAt: -1 });
        console.log('found trips:', loggedTrips.length);
        res.json(loggedTrips);
    } catch (error) {
        console.error('Error fetching logged trips:', error);
        res.status(500).json({ error: 'Failed to fetch logged trips' });
    }
};

export default getLoggedTrips;