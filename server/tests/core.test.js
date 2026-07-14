const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');

describe('Core Flows', () => {
  let ownerCookie;
  let tenantCookie;
  let ownerUser;
  let tenantUser;

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
  });

  it('Owner creates a listing', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('Cookie', ownerCookie)
      .send({
        title: 'Nice Room',
        description: 'A very nice room.',
        location: {
          city: 'NY',
          area: 'Downtown',
          address: '123 Main St'
        },
        rent: 1200,
        availableFrom: new Date(Date.now() + 86400000).toISOString(),
        roomType: 'private',
        furnishingStatus: 'furnished',
        photos: [],
        amenities: ['wifi']
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.description).toBe('A very nice room.');
  });

  it('Tenant creates a profile', async () => {
    const res = await request(app)
      .post('/api/tenant-profile')
      .set('Cookie', tenantCookie)
      .send({
        preferredLocation: {
          city: 'NY',
          area: 'Downtown'
        },
        budgetRange: {
          min: 1000,
          max: 2000
        },
        moveInDate: new Date(Date.now() + 86400000).toISOString(),
        preferences: 'I am a good tenant.'
      });

    // Handle 201 or 200 depending on implementation
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.data.preferences).toBe('I am a good tenant.');
  });

  it('Tenant browses listings and filled listings are hidden', async () => {
    // Owner creates 2 listings: one active, one filled
    await Listing.create({
      owner: ownerUser._id,
      title: 'Active Room',
      description: 'Active',
      location: {
        city: 'NY',
        area: 'Uptown',
        address: '456 Main St'
      },
      rent: 1000,
      availableFrom: new Date(),
      roomType: 'shared',
      furnishingStatus: 'semi-furnished',
      status: 'active'
    });

    await Listing.create({
      owner: ownerUser._id,
      title: 'Filled Room',
      description: 'Filled',
      location: {
        city: 'NY',
        area: 'Uptown',
        address: '456 Main St'
      },
      rent: 1000,
      availableFrom: new Date(),
      roomType: 'shared',
      furnishingStatus: 'semi-furnished',
      status: 'filled'
    });

    const res = await request(app)
      .get('/api/listings')
      .set('Cookie', tenantCookie);

    expect(res.statusCode).toBe(200);
    // Assuming response shape is { listings: [...] } or array, or { data: [...] }
    const listings = Array.isArray(res.body) ? res.body : (res.body.listings || res.body.data || []);
    expect(listings.length).toBe(1);
    expect(listings[0].description).toBe('Active');
  });
});
