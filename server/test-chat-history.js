const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:5001/api';
const SOCKET_URL = 'http://localhost:5001';

async function runTest() {
  try {
    const timestamp = Date.now();
    const ownerEmail = `owner_chat_${timestamp}@gmail.com`;
    const tenantEmail = `tenant_chat_${timestamp}@gmail.com`;
    const password = 'password123';

    console.log('--- Setup: Register Users and Create Interest ---');
    // 1. Register Owner
    const ownerRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Owner',
      email: ownerEmail,
      password,
      role: 'owner'
    });
    const ownerCookie = ownerRes.headers['set-cookie'][0];

    // 2. Register Tenant
    const tenantRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Tenant',
      email: tenantEmail,
      password,
      role: 'tenant'
    });
    const tenantCookie = tenantRes.headers['set-cookie'][0];

    // 3. Create Tenant Profile & Listing
    await axios.post(`${API_URL}/tenant-profile`, {
      preferredLocation: { city: 'Test', area: 'Test' },
      budgetRange: { min: 800, max: 1200 },
      moveInDate: new Date().toISOString(),
      preferences: 'Test'
    }, { headers: { Cookie: tenantCookie } });

    const listingRes = await axios.post(`${API_URL}/listings`, {
      location: { city: 'Test', area: 'Test', address: '123 Chat St' },
      rent: 1000,
      availableFrom: new Date().toISOString(),
      roomType: 'private',
      furnishingStatus: 'furnished',
      description: 'Test Listing for Chat'
    }, { headers: { Cookie: ownerCookie } });
    const listingId = listingRes.data.data._id;

    // 4. Tenant expresses interest and Owner accepts
    const interestRes = await axios.post(`${API_URL}/interests`, { listingId }, { headers: { Cookie: tenantCookie } });
    const interestId = interestRes.data.data._id;

    await axios.patch(`${API_URL}/interests/${interestId}/accept`, {}, { headers: { Cookie: ownerCookie } });
    console.log(`SUCCESS: Interest ${interestId} created and accepted.`);

    console.log('\n--- TEST: Connect and exchange messages via WebSockets ---');
    // Connect sockets
    const tenantSocket = io(SOCKET_URL, { extraHeaders: { Cookie: tenantCookie }, withCredentials: true });
    await new Promise(resolve => tenantSocket.on('connect', resolve));
    tenantSocket.emit('join_room', { interestId });
    await new Promise(r => setTimeout(r, 500));

    const ownerSocket = io(SOCKET_URL, { extraHeaders: { Cookie: ownerCookie }, withCredentials: true });
    await new Promise(resolve => ownerSocket.on('connect', resolve));
    ownerSocket.emit('join_room', { interestId });
    await new Promise(r => setTimeout(r, 500));

    // Send messages
    const p1Owner = new Promise(resolve => {
      ownerSocket.on('receive_message', (msg) => {
        if (msg.content === 'Hi, is this room still available?') {
          console.log(`[Socket] Owner received: ${msg.content}`);
          resolve();
        }
      });
    });
    
    tenantSocket.emit('send_message', { interestId, content: 'Hi, is this room still available?' });
    await p1Owner;

    const p2Tenant = new Promise(resolve => {
      tenantSocket.on('receive_message', (msg) => {
        if (msg.content === 'Yes, it is!') {
          console.log(`[Socket] Tenant received: ${msg.content}`);
          resolve();
        }
      });
    });

    ownerSocket.emit('send_message', { interestId, content: 'Yes, it is!' });
    await p2Tenant;
    
    // Disconnect sockets
    console.log('Disconnecting sockets...');
    tenantSocket.disconnect();
    ownerSocket.disconnect();

    console.log('\n--- TEST: Verify REST API Message Persistence ---');
    // Make HTTP GET request to fetch chat history
    const historyRes = await axios.get(`${API_URL}/interests/${interestId}/messages`, { 
        headers: { Cookie: tenantCookie } 
    });
    
    const messages = historyRes.data.data;
    console.log(`SUCCESS: Fetched ${historyRes.data.count} messages from REST API.`);
    
    if (messages.length !== 2) {
        throw new Error(`Expected 2 messages, got ${messages.length}`);
    }

    // Verify chronologic order
    const firstMsg = messages[0];
    const secondMsg = messages[1];
    
    if (new Date(firstMsg.createdAt) > new Date(secondMsg.createdAt)) {
        throw new Error('Messages are not in chronological order!');
    }
    
    console.log(`1. [${firstMsg.sender.name}] ${firstMsg.content}`);
    console.log(`2. [${secondMsg.sender.name}] ${secondMsg.content}`);
    console.log('SUCCESS: Messages are correctly persisted and retrieved in chronological order.');

    console.log('\nAll tests passed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTest();
