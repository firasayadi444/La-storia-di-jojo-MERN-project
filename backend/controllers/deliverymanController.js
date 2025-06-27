const mongoose = require("mongoose");
const Users = require('../models/userModel');
const Orders = require('../models/orderModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const deliverymanController = {
  // Submit new deliveryman application
  apply: async (req, res) => {
    try {
      const { name, email, phone, vehicleType } = req.body;
      const vehiclePhoto = req.files?.vehiclePhoto?.[0]?.filename || '';
      const facePhoto = req.files?.facePhoto?.[0]?.filename || '';
      const cinPhoto = req.files?.cinPhoto?.[0]?.filename || '';

      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required.' });
      }

      const existing = await Users.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use.' });
      }

      const user = new Users({
        name,
        email,
        phone: phone || '',
        role: 'delivery',
        status: 'pending',
        vehicleType: vehicleType || 'Not specified',
        vehiclePhoto,
        facePhoto,
        cinPhoto,
      });

      await user.save();
      res.status(201).json({ message: 'Application submitted successfully. You will be notified after acceptance.' });
    } catch (error) {
      console.error('Deliveryman application error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // List all pending deliveryman applications
  listPending: async (req, res) => {
    try {
      const pending = await Users.find({ role: 'delivery', status: 'pending' });
      res.json({ message: "Pending applications retrieved successfully", data: pending });
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

      // Generate password and update status
      const plainPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      user.password = hashedPassword;
      user.status = 'active';
      user.mustChangePassword = true;

      await user.save();

      // Send email if SMTP is configured
      if (process.env.MAIL_USER && process.env.MAIL_PASSWORD) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.MAIL_PORT || '587'),
            secure: false,
            auth: {
              user: process.env.MAIL_USER,
              pass: process.env.MAIL_PASSWORD,
            },
          });

          await transporter.sendMail({
            from: `"Food Delivery App" <${process.env.MAIL_USER}>`,
            to: user.email,
            subject: 'Delivery Man Application Approved',
            text: `Hello ${user.name},\n\nYour delivery application has been approved!\n\nLogin Email: ${user.email}\nTemporary Password: ${plainPassword}\n\nPlease change your password after your first login.\n\nThank you.`,
          });

          console.log(`✅ Email sent to ${user.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send email:', emailError);
        }
      } else {
        console.log(`⚠️ SMTP not configured. Manual password for ${user.email}: ${plainPassword}`);
      }

      res.json({
        message: 'Delivery man approved successfully.',
        email: user.email,
        password: plainPassword, // For admin manual notification
      });

    } catch (error) {
      console.error('❌ Approval error:', error);
      res.status(500).json({ message: 'Internal server error.' });
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

  // List all deliverymen
  listAll: async (req, res) => {
    try {
      const deliverymen = await Users.find({ role: 'delivery' });
      res.json({ message: "All delivery men retrieved successfully", data: deliverymen });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get one delivery man by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await Users.findById(id);

      if (!user || user.role !== 'delivery') {
        return res.status(404).json({ message: 'Delivery man not found.' });
      }

      res.json({ message: "Delivery man retrieved successfully", data: user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete delivery man by ID
  deleteById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await Users.findById(id);

      if (!user || user.role !== 'delivery') {
        return res.status(404).json({ message: 'Delivery man not found.' });
      }

      await user.deleteOne();
      res.json({ message: 'Delivery man deleted successfully.' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update delivery man availability
  updateAvailability: async (req, res) => {
    try {
      const { isAvailable } = req.body;
      const deliveryManId = req.user._id;

      if (typeof isAvailable !== 'boolean') {
        return res.status(400).json({ message: 'isAvailable must be a boolean value.' });
      }

      const user = await Users.findById(deliveryManId);
      if (!user || user.role !== 'delivery') {
        return res.status(404).json({ message: 'Delivery man not found.' });
      }

      // Check if delivery man is trying to go unavailable while having active orders
      if (!isAvailable) {
        const activeOrders = await Orders.find({
          deliveryMan: deliveryManId,
          status: { $in: ['ready', 'out_for_delivery'] }
        });

        if (activeOrders.length > 0) {
          return res.status(400).json({ 
            message: 'Cannot go unavailable while you have active deliveries. Please complete or cancel your current deliveries first.',
            activeOrdersCount: activeOrders.length
          });
        }
      }

      user.isAvailable = isAvailable;
      await user.save();

      res.json({ 
        message: `Availability updated successfully. You are now ${isAvailable ? 'available' : 'unavailable'}.`,
        isAvailable: user.isAvailable
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = deliverymanController;
