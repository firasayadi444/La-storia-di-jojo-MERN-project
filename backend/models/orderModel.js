const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    items: [{
      food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'food',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      },
    }],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    deliveryMan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    },
    estimatedDeliveryTime: {
      type: Date,
    },
    actualDeliveryTime: {
      type: Date,
    },
    deliveryNotes: {
      type: String,
    },
    deliveryRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    foodRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedbackComment: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("order", orderSchema);
