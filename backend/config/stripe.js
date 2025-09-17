const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key');

module.exports = stripe;
