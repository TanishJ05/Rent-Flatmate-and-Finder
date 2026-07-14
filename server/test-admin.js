require('dotenv').config({ path: './server/.env' });
const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('Starting Admin API tests...\n');

  try {
    // 1. Authenticate as a standard user (tenant)
    console.log('--- 1. Authenticating as standard user ---');
    const tenantCredentials = {
      email: `tenant_${Date.now()}@test.com`,
      password: 'password123',
      name: 'Test Tenant',
      role: 'tenant'
    };

    const tenantRes = await axios.post(`${BASE_URL}/auth/register`, tenantCredentials);
    const tenantCookie = tenantRes.headers['set-cookie'][0];
    console.log('Standard user authenticated successfully.');

    // 2. Attempt to access admin routes (expecting 403)
    console.log('\n--- 2. Attempting admin access as standard user ---');
    try {
      await axios.get(`${BASE_URL}/admin/stats`, {
        headers: { Cookie: tenantCookie }
      });
      console.log('❌ FAIL: Standard user accessed admin stats endpoint!');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ SUCCESS: Standard user received 403 Forbidden.');
      } else {
        console.log(`❌ FAIL: Expected 403, got ${error.response?.status}`);
      }
    }

    // 3. Setup and Authenticate as an Admin
    console.log('\n--- 3. Setting up Admin Account ---');
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./src/models/User');

    const adminEmail = `admin_${Date.now()}@test.com`;
    const adminUser = await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: 'adminpassword',
      role: 'admin'
    });
    console.log(`Admin user ${adminEmail} created in DB.`);

    const adminRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: adminEmail,
      password: 'adminpassword'
    });
    const adminCookie = adminRes.headers['set-cookie'][0];
    console.log('Admin user authenticated successfully.');

    // 4. Test GET /api/admin/stats
    console.log('\n--- 4. Testing GET /api/admin/stats ---');
    const statsRes = await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { Cookie: adminCookie }
    });
    console.log('Stats Response:', JSON.stringify(statsRes.data, null, 2));

    // 5. Test GET /api/admin/users
    console.log('\n--- 5. Testing GET /api/admin/users ---');
    const usersRes = await axios.get(`${BASE_URL}/admin/users?limit=5`, {
      headers: { Cookie: adminCookie }
    });
    console.log('Users Response (paginated):', JSON.stringify(usersRes.data, null, 2));

    // 6. Test PATCH /api/admin/users/:id/status
    console.log('\n--- 6. Testing PATCH /api/admin/users/:id/status ---');
    const targetUserId = tenantRes.data.user._id;
    const statusRes = await axios.patch(`${BASE_URL}/admin/users/${targetUserId}/status`, {}, {
      headers: { Cookie: adminCookie }
    });
    console.log('User Status Toggle Response:', JSON.stringify(statusRes.data, null, 2));

    // 7. Test GET /api/admin/listings
    console.log('\n--- 7. Testing GET /api/admin/listings ---');
    const listingsRes = await axios.get(`${BASE_URL}/admin/listings?limit=5`, {
      headers: { Cookie: adminCookie }
    });
    console.log('Listings Response:', JSON.stringify(listingsRes.data, null, 2));

    console.log('\n✅ All admin tests executed successfully!');
  } catch (error) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
  } finally {
    mongoose.connection.close();
  }
}

runTests();
