const Users = require('../models/userModel');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const deliverymanController = {
  apply: async (req, res) => {
    try {
      const { name, email, phone, vehicleType } = req.body;
      const vehiclePhoto = req.files['vehiclePhoto']?.[0]?.filename || '';
      const facePhoto = req.files['facePhoto']?.[0]?.filename || '';
      const cinPhoto = req.files['cinPhoto']?.[0]?.filename || '';

      // Check if email already exists
      const existing = await Users.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use.' });
      }

      const user = new Users({
        name,
        email,
        phone,
        role: 'delivery',
        status: 'pending',
        vehicleType,
        vehiclePhoto,
        facePhoto,
        cinPhoto,
      });
      await user.save();
      res.status(201).json({ message: 'Application submitted. You will be notified after acceptance.' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // List all pending deliveryman applications
  listPending: async (req, res) => {
    try {
      const pending = await Users.find({ role: 'delivery', status: 'pending' });
      res.json({ pending });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Approve a deliveryman application
  approve: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await Users.findById(id);
      if (!user || user.role !== 'delivery' || user.status !== 'pending') {
        return res.status(404).json({ message: 'Application not found.' });
      }
      // Generate random password
      const password = crypto.randomBytes(8).toString('hex');
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
      user.status = 'active';
      user.mustChangePassword = true;
      await user.save();
      // Send email with password
      // (Configure your SMTP settings in .env or here)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: 'Delivery Man Application Approved',
        text: `Your application has been approved!\nLogin email: ${user.email}\nTemporary password: ${password}\nYou must change your password after first login.`
      });
      res.json({ message: 'Delivery man approved and notified by email.' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Reject a deliveryman application
  reject: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await Users.findById(id);
      if (!user || user.role !== 'delivery' || user.status !== 'pending') {
        return res.status(404).json({ message: 'Application not found.' });
      }
      user.status = 'rejected';
      await user.save();
      res.json({ message: 'Application rejected.' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // List all delivery men (any status)
  listAll: async (req, res) => {
    try {
      const deliverymen = await Users.find({ role: 'delivery' });
      res.json({ deliverymen });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get a single delivery man by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await Users.findById(id);
      if (!user || user.role !== 'delivery') {
        return res.status(404).json({ message: 'Delivery man not found.' });
      }
      res.json({ deliveryman: user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = deliverymanController; 