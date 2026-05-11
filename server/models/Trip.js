import mongoose from 'mongoose';
import User from './User.js';
// data model for a trip
// stores start, end, route, and weather points to be rechecked when replotting a trip from the log
const tripSchema = new mongoose.Schema({
  // reference to the user who created the trip
  // this allows us to associate trips with users and retrieve a user's trip history
  // and only their own trips when they are logged in
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  start: {
    location: String,
    lat: Number,
    lon: Number,
  },
  end: {
    location: String,
    lat: Number,
    lon: Number,
  },
  route: {
    distance: Number,
    duration: Number,
    geometry: Object,
    weatherPoints: Array,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
