const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
    },
    password: {
      type: String,
      required: function() {
        // Password is required unless status is 'pending' and role is 'delivery'
        return !(this.role === 'delivery' && this.status === 'pending');
      },
    },
    role: {
      type: String,
      enum: ["user", "admin", "delivery"],
      default: "user",
    },
    address: {
      type: String,
    },
    phone: {
      type: String,
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    currentLocation: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected'],
      default: 'active',
    },
    vehicleType: {
      type: String,
    },
    vehiclePhoto: {
      type: String,
    },
    facePhoto: {
      type: String,
    },
    cinPhoto: {
      type: String,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("user", userSchema);
