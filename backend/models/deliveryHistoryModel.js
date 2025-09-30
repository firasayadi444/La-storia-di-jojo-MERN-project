const mongoose = require("mongoose");

const deliveryHistorySchema = new mongoose.Schema(
  {
    deliveryManId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'order',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    // Delivery tracking data
    pickupLocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String },
      timestamp: { type: Date, default: Date.now }
    },
    deliveryLocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    },
    // Route tracking
    routePoints: [{
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      timestamp: { type: Date, default: Date.now },
      accuracy: { type: Number },
      speed: { type: Number },
      heading: { type: Number }
    }],
    // Delivery metrics
    totalDistance: {
      type: Number, // in meters
      default: 0
    },
    totalTime: {
      type: Number, // in minutes
      default: 0
    },
    averageSpeed: {
      type: Number, // in km/h
      default: 0
    },
    // Status tracking
    statusHistory: [{
      status: {
        type: String,
        enum: ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'],
        required: true
      },
      timestamp: { type: Date, default: Date.now },
      location: {
        latitude: { type: Number },
        longitude: { type: Number }
      },
      notes: { type: String }
    }],
    // Performance metrics
    deliveryRating: {
      type: Number,
      min: 1,
      max: 5
    },
    deliveryNotes: {
      type: String
    },
    customerFeedback: {
      type: String
    },
    // Timestamps
    assignedAt: { type: Date, default: Date.now },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes for better query performance
deliveryHistorySchema.index({ deliveryManId: 1, createdAt: -1 });
deliveryHistorySchema.index({ orderId: 1 });
deliveryHistorySchema.index({ customerId: 1 });
deliveryHistorySchema.index({ 'pickupLocation.latitude': 1, 'pickupLocation.longitude': 1 });
deliveryHistorySchema.index({ 'deliveryLocation.latitude': 1, 'deliveryLocation.longitude': 1 });
deliveryHistorySchema.index({ assignedAt: -1 });
deliveryHistorySchema.index({ deliveredAt: -1 });

// Virtual for delivery duration
deliveryHistorySchema.virtual('deliveryDuration').get(function() {
  if (this.assignedAt && this.deliveredAt) {
    return Math.round((this.deliveredAt - this.assignedAt) / (1000 * 60)); // minutes
  }
  return null;
});

// Method to add route point
deliveryHistorySchema.methods.addRoutePoint = function(lat, lng, accuracy, speed, heading) {
  this.routePoints.push({
    latitude: lat,
    longitude: lng,
    timestamp: new Date(),
    accuracy: accuracy || 10,
    speed: speed || 0,
    heading: heading || 0
  });
  return this.save();
};

// Method to update status
deliveryHistorySchema.methods.updateStatus = function(status, lat, lng, notes) {
  this.statusHistory.push({
    status: status,
    timestamp: new Date(),
    location: lat && lng ? { latitude: lat, longitude: lng } : undefined,
    notes: notes
  });
  
  // Update specific timestamps
  switch (status) {
    case 'picked_up':
      this.pickedUpAt = new Date();
      break;
    case 'delivered':
      this.deliveredAt = new Date();
      this.completedAt = new Date();
      break;
  }
  
  return this.save();
};

// Method to calculate delivery metrics
deliveryHistorySchema.methods.calculateMetrics = function() {
  if (this.routePoints.length < 2) return;
  
  let totalDistance = 0;
  let totalTime = 0;
  
  for (let i = 1; i < this.routePoints.length; i++) {
    const prev = this.routePoints[i - 1];
    const curr = this.routePoints[i];
    
    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      prev.latitude, prev.longitude,
      curr.latitude, curr.longitude
    );
    totalDistance += distance;
    
    // Calculate time difference
    const timeDiff = (curr.timestamp - prev.timestamp) / (1000 * 60); // minutes
    totalTime += timeDiff;
  }
  
  this.totalDistance = Math.round(totalDistance);
  this.totalTime = Math.round(totalTime);
  this.averageSpeed = totalTime > 0 ? Math.round((totalDistance / 1000) / (totalTime / 60)) : 0; // km/h
};

// Helper method to calculate distance between two points
deliveryHistorySchema.methods.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

module.exports = mongoose.model("deliveryHistory", deliveryHistorySchema);
