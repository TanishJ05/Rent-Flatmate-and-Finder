const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('MongoDB Connected for Seeding...');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('Please provide ADMIN_EMAIL and ADMIN_PASSWORD in .env');
      process.exit(1);
    }

    // Check if admin already exists
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('Admin user already exists. Updating password...');
      admin.password = adminPassword;
      admin.role = 'admin';
      await admin.save();
      console.log('Admin user updated successfully.');
    } else {
      console.log('Creating new admin user...');
      admin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log('Admin user created successfully.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
