const request = require('supertest');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const app = require('../src/app');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const Interest = require('../src/models/Interest');
const { initSockets } = require('../src/sockets');

describe('WebSockets & Chat', () => {
  let ownerCookie;
  let tenantCookie;
  let ownerUser;
  let tenantUser;
  let listing;
  let interest;
  let io;
  let serverSocket;
  let clientSocket;
  let httpServer;
  let port;

  beforeAll((done) => {
    httpServer = createServer(app);
    io = initSockets(httpServer);
    httpServer.listen(() => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  beforeEach(async () => {
    ownerUser = await User.create({
      name: 'Owner',
      email: 'owner@example.com',
      password: 'password123',
      role: 'owner'
    });
    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'password123' });
    ownerCookie = ownerLogin.headers['set-cookie'];

    tenantUser = await User.create({
      name: 'Tenant',
      email: 'tenant@example.com',
      password: 'password123',
      role: 'tenant'
    });
    const tenantLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tenant@example.com', password: 'password123' });
    tenantCookie = tenantLogin.headers['set-cookie'];

    listing = await Listing.create({
      owner: ownerUser._id,
      title: 'Nice Room',
      description: 'A very nice room.',
      location: {
        city: 'NY',
        area: 'Downtown',
        address: '123 Main St'
      },
      rent: 1200,
      availableFrom: new Date(),
      roomType: 'private',
      furnishingStatus: 'furnished',
      status: 'active'
    });

    interest = await Interest.create({
      tenant: tenantUser._id,
      listing: listing._id,
      owner: ownerUser._id,
      status: 'accepted' // Must be accepted to chat
    });
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.close();
    }
  });

  it('Authenticates socket with JWT, exchanges message, and retrieves via REST', (done) => {
    // Extract token from cookie string (naive split for test)
    const tokenCookie = tenantCookie.find(c => c.startsWith('token='));
    const token = tokenCookie.split(';')[0].split('=')[1];

    clientSocket = new Client(`http://localhost:${port}`, {
      extraHeaders: {
        cookie: `token=${token}`
      }
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('join_room', { interestId: interest._id.toString() });
    });

    clientSocket.on('connect_error', (err) => {
      done(err);
    });

    clientSocket.on('receive_message', async (msg) => {
      try {
        expect(msg.content).toBe('Hello from tenant!');
        expect(msg.sender._id ? msg.sender._id.toString() : msg.sender).toBe(tenantUser._id.toString());
        
        // Now check REST endpoint
        const res = await request(app)
          .get(`/api/interests/${interest._id}/messages`)
          .set('Cookie', ownerCookie); // Owner reads messages
          
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].content).toBe('Hello from tenant!');
        
        done();
      } catch (err) {
        done(err);
      }
    });

    clientSocket.on('error', (err) => {
      done(err);
    });

    setTimeout(() => {
      clientSocket.emit('send_message', {
        interestId: interest._id.toString(),
        content: 'Hello from tenant!'
      });
    }, 500); // Wait briefly to join room
  });
});
