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
                                      .sort({ createdAt: -1 })
                                      .limit(50);
        console.log('found trips:', loggedTrips.length);
        res.json(loggedTrips);
    } catch (error) {
        console.error('Error fetching logged trips:', error);
        res.status(500).json({ error: 'Failed to fetch logged trips' });
    }
};

export default getLoggedTrips;
// names one of the signed-in user's own trips
const renameTrip = async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Sign in to name trips' });
    const { name } = req.body;
    if (typeof name !== 'string') return res.status(400).json({ error: 'Name must be text' });
    try {
        // userId in the filter keeps users from renaming someone else's trip
        const trip = await Trip.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { name: name.trim().slice(0, 60) },
            { new: true, runValidators: true }
        );
        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        res.json(trip);
    } catch (error) {
        // a malformed id is just a trip that does not exist
        if (error.name === 'CastError') return res.status(404).json({ error: 'Trip not found' });
        console.error('Error renaming trip:', error);
        res.status(500).json({ error: 'Failed to rename trip' });
    }
};

export { renameTrip };
