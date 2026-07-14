const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const emailService = require('../src/services/emailService');

describe('Email Notifications', () => {
  let ownerCookie;
  let tenantCookie;
  let ownerUser;
  let tenantUser;
  let listing;

  beforeEach(async () => {
    jest.spyOn(emailService, 'notifyOwnerNewInterest').mockResolvedValue(true);
    jest.spyOn(emailService, 'notifyTenantRequestAccepted').mockResolvedValue(true);
    jest.spyOn(emailService, 'notifyOwnerHighCompatibilityInterest').mockResolvedValue(true);

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Sends new interest email when interest is created', async () => {
    await request(app)
      .post('/api/interests')
      .set('Cookie', tenantCookie)
      .send({ listingId: listing._id, message: 'I am interested' });

    expect(emailService.notifyOwnerNewInterest).toHaveBeenCalled();
  });

  it('Sends status update email when interest is accepted', async () => {
    const interestRes = await request(app)
      .post('/api/interests')
      .set('Cookie', tenantCookie)
      .send({ listingId: listing._id, message: 'I am interested' });

    const interestId = interestRes.body.data._id;

    const acceptRes = await request(app)
      .patch(`/api/interests/${interestId}/accept`)
      .set('Cookie', ownerCookie);

    expect(emailService.notifyTenantRequestAccepted).toHaveBeenCalled();
  });
});
