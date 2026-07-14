require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// 1. MOCK NODEMAILER BEFORE ANYTHING ELSE IS REQUIRED
const nodemailer = require('nodemailer');
const originalCreateTransport = nodemailer.createTransport;
nodemailer.createTransport = function(options) {
  const transporter = originalCreateTransport.call(this, options);
  // Override sendMail to simulate a network/SMTP failure
  transporter.sendMail = async (mailOptions) => {
    console.log(`\n[Mock Nodemailer] Intercepting email to ${mailOptions.to}...`);
    console.log('[Mock Nodemailer] Simulating ENOTFOUND / SMTP Timeout Error...');
    throw new Error('INTENTIONAL_MOCK_ERROR: Simulated SMTP Timeout/Auth Failure');
  };
  return transporter;
};
// Ensure createTestAccount doesn't do real network calls if Ethereal is used
nodemailer.createTestAccount = async () => ({ user: 'mock', pass: 'mock' });

// 2. REQUIRE APP AFTER MOCKING
const app = require('./src/app');
const http = require('http');

// 3. START SERVER AND RUN TEST
const PORT = 0; // random open port
const server = http.createServer(app);

const runTest = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    await new Promise((resolve) => server.listen(PORT, resolve));
    const port = server.address().port;
    console.log(`Test server running on port ${port}`);

    // Create a mock tenant and owner
    const User = require('./src/models/User');
    const Listing = require('./src/models/Listing');
    const Interest = require('./src/models/Interest');
    const Notification = require('./src/models/Notification'); // ensure it exists for cleanup

    // Create temp users for test
    const owner = await User.create({
      name: 'Test Owner',
      email: `owner_${Date.now()}@test.com`,
      password: 'password123',
      role: 'owner'
    });

    const tenant = await User.create({
      name: 'Test Tenant',
      email: `tenant_${Date.now()}@test.com`,
      password: 'password123',
      role: 'tenant'
    });

    // Create temp listing
    const listing = await Listing.create({
      owner: owner._id,
      location: { city: 'TestCity', area: 'TestArea', address: '123 Test St' },
      rent: 1000,
      availableFrom: new Date(),
      roomType: 'private',
      furnishingStatus: 'furnished'
    });

    // Generate JWT cookie string for the tenant
    const token = jwt.sign({ id: tenant._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const cookie = `token=${token}`;

    console.log('\nMaking POST request to /api/interests...');
    
    const response = await fetch(`http://localhost:${port}/api/interests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify({ listingId: listing._id })
    });

    const responseData = await response.json();

    if (response.status === 201) {
      console.log('\n✅ Fault tolerance verified: API succeeded despite email failure.');
      console.log('Response body:', responseData);
    } else {
      console.error('\n❌ Fault tolerance failed: API returned status', response.status);
      console.error('Response body:', responseData);
      process.exitCode = 1;
    }

    // Cleanup
    if (responseData.data && responseData.data._id) {
      await Notification.deleteMany({ relatedInterest: responseData.data._id });
    }
    await Interest.deleteMany({ listing: listing._id });
    await Listing.findByIdAndDelete(listing._id);
    await User.findByIdAndDelete(owner._id);
    await User.findByIdAndDelete(tenant._id);
    
  } catch (err) {
    console.error('Test script failed with error:', err);
    process.exitCode = 1;
  } finally {
    // Graceful shutdown
    console.log('\nCleaning up and exiting...');
    await mongoose.connection.close();
    server.close();
  }
};

runTest();
