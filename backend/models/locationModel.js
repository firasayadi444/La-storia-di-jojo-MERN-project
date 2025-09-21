const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    address: {
      type: String,
      trim: true,
    },
    accuracy: {
      type: Number, // GPS accuracy in meters
    },
    altitude: {
      type: Number, // Altitude in meters
    },
    speed: {
      type: Number, // Speed in m/s
    },
    heading: {
      type: Number, // Direction in degrees (0-360)
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true, // For delivery tracking
    },
  },
  { timestamps: true }
);

// Geospatial index for location queries
locationSchema.index({ 
  location: "2dsphere" 
});

// Compound indexes for better query performance
locationSchema.index({ userId: 1, timestamp: -1 });
locationSchema.index({ userId: 1, isActive: 1 });
locationSchema.index({ timestamp: -1 });

// Virtual field for GeoJSON Point
locationSchema.virtual('location').get(function() {
  return {
    type: 'Point',
    coordinates: [this.longitude, this.latitude]
  };
});

// Ensure virtual fields are serialized
locationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("location", locationSchema);
