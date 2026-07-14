const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:5001/api';
const SOCKET_URL = 'http://localhost:5001';

async function runTest() {
  try {
    const timestamp = Date.now();
    const ownerEmail = `owner_${timestamp}@gmail.com`;
    const tenantEmail = `tenant_${timestamp}@gmail.com`;
    const outsiderEmail = `outsider_${timestamp}@gmail.com`;
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

    // 2. Register Tenant
    console.log('Registering tenant...');
    const tenantRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Tenant',
      email: tenantEmail,
      password,
      role: 'tenant'
    });
    const tenantCookie = tenantRes.headers['set-cookie'][0];

    // 3. Register Outsider
    console.log('Registering outsider...');
    const outsiderRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Outsider',
      email: outsiderEmail,
      password,
      role: 'tenant'
    });
    const outsiderCookie = outsiderRes.headers['set-cookie'][0];

    // 4. Create Tenant Profile & Listing
    await axios.post(`${API_URL}/tenant-profile`, {
      preferredLocation: { city: 'Test', area: 'Test' },
      budgetRange: { min: 800, max: 1200 },
      moveInDate: new Date().toISOString(),
      preferences: 'Test'
    }, { headers: { Cookie: tenantCookie } });

    const listingRes = await axios.post(`${API_URL}/listings`, {
      location: { city: 'Test', area: 'Test', address: '123 Test' },
      rent: 1000,
      availableFrom: new Date().toISOString(),
      roomType: 'private',
      furnishingStatus: 'furnished',
      description: 'Test'
    }, { headers: { Cookie: ownerCookie } });
    const listingId = listingRes.data.data._id;

    // 5. Tenant expresses interest
    console.log('Tenant expressing interest...');
    const interestRes = await axios.post(`${API_URL}/interests`, { listingId }, { headers: { Cookie: tenantCookie } });
    const interestId = interestRes.data.data._id;

    console.log('--- TEST: Connect and join pending interest ---');
    // Connect tenant socket
    const tenantSocket = io(SOCKET_URL, { extraHeaders: { Cookie: tenantCookie }, withCredentials: true });
    
    await new Promise(resolve => tenantSocket.on('connect', resolve));
    console.log('Tenant connected');

    tenantSocket.emit('join_room', { interestId });
    
    await new Promise((resolve) => {
      tenantSocket.once('room_error', (err) => {
        console.log('SUCCESS: Tenant rejected joining pending room:', err.message);
        resolve();
      });
    });

    // 6. Owner accepts interest
    console.log('Owner accepting interest...');
    await axios.patch(`${API_URL}/interests/${interestId}/accept`, {}, { headers: { Cookie: ownerCookie } });

    console.log('--- TEST: Connect and exchange messages in accepted interest ---');
    tenantSocket.emit('join_room', { interestId });
    // Wait for a bit for join to process
    await new Promise(r => setTimeout(r, 500));

    const ownerSocket = io(SOCKET_URL, { extraHeaders: { Cookie: ownerCookie }, withCredentials: true });
    await new Promise(resolve => ownerSocket.on('connect', resolve));
    console.log('Owner connected');
    ownerSocket.emit('join_room', { interestId });
    await new Promise(r => setTimeout(r, 500));

    // Send message from Tenant
    tenantSocket.emit('send_message', { interestId, content: 'Hello Owner!' });

    await new Promise((resolve) => {
      ownerSocket.once('receive_message', (msg) => {
        console.log('SUCCESS: Owner received message:', msg.content, 'from', msg.sender.name);
        resolve();
      });
    });

    // Owner sends back
    ownerSocket.emit('send_message', { interestId, content: 'Hello Tenant!' });
    await new Promise((resolve) => {
      tenantSocket.once('receive_message', (msg) => {
        console.log('SUCCESS: Tenant received message:', msg.content, 'from', msg.sender.name);
        resolve();
      });
    });

    // 7. Verify REST API
    console.log('--- TEST: Verify REST APIs ---');
    const getMessagesRes = await axios.get(`${API_URL}/interests/${interestId}/messages`, { headers: { Cookie: tenantCookie } });
    console.log(`SUCCESS: Fetched ${getMessagesRes.data.count} messages from API`);
    
    // Mark as read
    const markReadRes = await axios.patch(`${API_URL}/interests/${interestId}/messages/read`, {}, { headers: { Cookie: tenantCookie } });
    console.log(`SUCCESS: Marked messages as read: ${markReadRes.data.message}`);

    // 8. Outsider attempts to join
    console.log('--- TEST: Outsider joining accepted room ---');
    const outsiderSocket = io(SOCKET_URL, { extraHeaders: { Cookie: outsiderCookie }, withCredentials: true });
    await new Promise(resolve => outsiderSocket.on('connect', resolve));
    
    outsiderSocket.emit('join_room', { interestId });
    await new Promise((resolve) => {
      outsiderSocket.once('room_error', (err) => {
        console.log('SUCCESS: Outsider rejected joining room:', err.message);
        resolve();
      });
    });

    console.log('All tests passed!');
    tenantSocket.disconnect();
    ownerSocket.disconnect();
    outsiderSocket.disconnect();
    process.exit(0);

  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTest();
