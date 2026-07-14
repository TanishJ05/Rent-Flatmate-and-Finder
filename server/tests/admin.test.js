const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');

describe('Admin Functions', () => {
  let adminCookie;
  let adminUser;

  beforeEach(async () => {
    adminUser = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });
    
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
      
    adminCookie = loginRes.headers['set-cookie'];

    // Seed some data
    await User.create({
      name: 'Tenant 1',
      email: 't1@example.com',
      password: 'password123',
      role: 'tenant'
    });

    const owner = await User.create({
      name: 'Owner 1',
      email: 'o1@example.com',
      password: 'password123',
      role: 'owner'
    });

    await Listing.create({
      owner: owner._id,
      title: 'Admin Test Room',
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

  it('Allows admin to list all users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', adminCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3); // Admin, Tenant, Owner
  });

  it('Allows admin to list all listings', async () => {
    const res = await request(app)
      .get('/api/admin/listings')
      .set('Cookie', adminCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].description).toBe('A very nice room.');
  });

  it('Allows admin to get stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', adminCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('users');
    expect(res.body.data).toHaveProperty('listings');
  });
});
