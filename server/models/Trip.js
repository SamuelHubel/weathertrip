import mongoose from 'mongoose';
// data model for a trip
// stores start, end and route length; replotting a trip from the log fetches the route and weather again
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
  // stops between start and end, in driving order
  stops: [{
    location: String,
    lat: Number,
    lon: Number,
  }],
  end: {
    location: String,
    lat: Number,
    lon: Number,
  },
  route: {
    distance: Number,
    duration: Number,
  },
  // optional name the user gives the trip after plotting it
  name: { type: String, trim: true, maxlength: 60 },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

tripSchema.index({ userId: 1, createdAt: -1 });

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
