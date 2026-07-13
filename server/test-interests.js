const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function runTest() {
  try {
    const timestamp = Date.now();
    const ownerEmail = `owner_${timestamp}@gmail.com`; // using gmail to avoid immediate hard bounces
    const tenantEmail = `tenant_${timestamp}@gmail.com`;
    const password = 'password123';

    // 1. Register Owner
    console.log('Registering owner...');
    const ownerRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Owner',
      email: ownerEmail,
      password,
      role: 'owner'
    });
    const ownerCookie = ownerRes.headers['set-cookie'][0];
    const ownerId = ownerRes.data.user._id;

    // 2. Register Tenant
    console.log('Registering tenant...');
    const tenantRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Tenant',
      email: tenantEmail,
      password,
      role: 'tenant'
    });
    const tenantCookie = tenantRes.headers['set-cookie'][0];

    // 3. Create Tenant Profile (needed for compatibility scoring)
    console.log('Creating tenant profile...');
    await axios.post(`${API_URL}/tenant-profile`, {
      preferredLocation: {
        city: 'Testville',
        area: 'Downtown'
      },
      budgetRange: {
        min: 800,
        max: 1200
      },
      moveInDate: new Date(Date.now() + 86400000).toISOString(),
      preferences: 'Quiet, non-smoking, vegetarian'
    }, {
      headers: { Cookie: tenantCookie }
    });

    // 4. Create Listing (by owner)
    console.log('Creating listing...');
    const listingRes = await axios.post(`${API_URL}/listings`, {
      location: { city: 'Testville', area: 'Downtown', address: '123 Main St' },
      rent: 1000,
      availableFrom: new Date(Date.now() + 86400000).toISOString(),
      roomType: 'private',
      furnishingStatus: 'furnished',
      description: 'A great place for a clean professional.'
    }, {
      headers: { Cookie: ownerCookie }
    });
    const listingId = listingRes.data.data._id;

    // 5. Tenant expresses interest
    console.log('Tenant expressing interest (will compute score)...');
    const interestRes = await axios.post(`${API_URL}/interests`, {
      listingId
    }, {
      headers: { Cookie: tenantCookie }
    });
    const interestId = interestRes.data.data._id;
    console.log(`Interest created with status: ${interestRes.data.data.status}, score: ${interestRes.data.data.compatibilityScoreAtRequest}`);

    // Wait a few seconds for email to be processed
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 6. Owner gets incoming interests
    console.log('Owner fetching incoming interests...');
    const receivedRes = await axios.get(`${API_URL}/interests/received`, {
      headers: { Cookie: ownerCookie }
    });
    console.log(`Owner received ${receivedRes.data.count} interests.`);

    // 7. Owner accepts interest
    console.log('Owner accepting interest...');
    await axios.patch(`${API_URL}/interests/${interestId}/accept`, {}, {
      headers: { Cookie: ownerCookie }
    });

    // Wait a few seconds for email
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 8. Tenant checks notifications
    console.log('Tenant checking notifications...');
    const tenantNotifs = await axios.get(`${API_URL}/notifications/mine`, {
      headers: { Cookie: tenantCookie }
    });
    console.log('Tenant notifications:');
    tenantNotifs.data.data.forEach(n => console.log(`- ${n.type}: ${n.message}`));

    // 9. Owner checks notifications
    console.log('Owner checking notifications...');
    const ownerNotifs = await axios.get(`${API_URL}/notifications/mine`, {
      headers: { Cookie: ownerCookie }
    });
    console.log('Owner notifications:');
    ownerNotifs.data.data.forEach(n => console.log(`- ${n.type}: ${n.message}`));

    console.log('Test completed successfully!');

  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
  }
}

runTest();
