const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Auth & RBAC', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'tenant'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty('_id');
    expect(res.body.user.name).toBe('Test User');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.role).toBe('tenant');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should login an existing user and generate JWT cookie', async () => {
    await User.create({
      name: 'Login User',
      email: 'login@example.com',
      password: 'password123',
      role: 'owner'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty('_id');
    expect(res.headers['set-cookie']).toBeDefined();
    
    // Check if token is in cookie
    const cookies = res.headers['set-cookie'].join(';');
    expect(cookies).toContain('token=');
  });

  it('should enforce role-based access for an owner-only route', async () => {
    const tenantUser = await User.create({
      name: 'Tenant User',
      email: 'tenant@example.com',
      password: 'password123',
      role: 'tenant'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'tenant@example.com',
        password: 'password123'
      });

    const cookie = loginRes.headers['set-cookie'];

    // Assuming POST /api/listings is owner only
    const res = await request(app)
      .post('/api/listings')
      .set('Cookie', cookie)
      .send({
        title: 'Test Listing',
        description: 'Testing RBAC',
        location: 'NYC',
        rent: 1000,
        availableFrom: new Date(Date.now() + 86400000).toISOString()
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Not authorized/i);
  });
});
