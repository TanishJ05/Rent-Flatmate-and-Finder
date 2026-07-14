const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const Interest = require('../src/models/Interest');

describe('Interests Flow', () => {
  let ownerCookie;
  let tenantCookie;
  let ownerUser;
  let tenantUser;
  let listing;

  beforeEach(async () => {
    // Setup Owner
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

    // Setup Tenant
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

    // Setup Listing
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
  });

  it('Tenant creates an interest request', async () => {
    const res = await request(app)
      .post('/api/interests')
      .set('Cookie', tenantCookie)
      .send({ listingId: listing._id, message: 'I am interested' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.status).toBe('pending');
  });

  it('Duplicate interest prevention (409 Conflict)', async () => {
    await request(app)
      .post('/api/interests')
      .set('Cookie', tenantCookie)
      .send({ listingId: listing._id, message: 'I am interested' });

    const res = await request(app)
      .post('/api/interests')
      .set('Cookie', tenantCookie)
      .send({ listingId: listing._id, message: 'I am still interested' });

    expect(res.statusCode).toBe(409);
  });

  it('Owner accept/decline flow', async () => {
    const interestRes = await request(app)
      .post('/api/interests')
      .set('Cookie', tenantCookie)
      .send({ listingId: listing._id, message: 'I am interested' });

    const interestId = interestRes.body.data._id;

    // Owner accepts
    const acceptRes = await request(app)
      .patch(`/api/interests/${interestId}/accept`)
      .set('Cookie', ownerCookie);

    expect(acceptRes.statusCode).toBe(200);
    expect(acceptRes.body.data.status).toBe('accepted');
  });
});
