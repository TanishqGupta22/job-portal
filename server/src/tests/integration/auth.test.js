const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const appFactory = require('../../server');
const User = require('../../models/User');

jest.mock('../../utils/email', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(),
  sendResetPasswordEmail: jest.fn().mockResolvedValue(),
}));

let app;
let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  process.env.JWT_ACCESS_SECRET = 'test_access';
  process.env.JWT_REFRESH_SECRET = 'test_refresh';
  process.env.CLIENT_URL = 'http://localhost:5173';
  // Require server after env prepared; export app from server module
  const serverModule = require('../../server');
  app = serverModule.app || appFactory.app || serverModule; // support export styles
});

afterAll(async () => {
  await mongoose.connection?.close();
  await mongo.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Authentication API', () => {
  it('registers and sends OTP', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 't@example.com', password: 'Password1', role: 'job_seeker' })
      .expect(201);
    expect(res.body.message).toMatch(/verify/i);
  });

  it('rejects login before verification', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 't2@example.com', password: 'Password1', role: 'job_seeker' })
      .expect(201);
    await request(app)
      .post('/api/auth/login')
      .send({ email: 't2@example.com', password: 'Password1' })
      .expect(403);
  });

  it('verifies OTP and logs in', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 't3@example.com', password: 'Password1', role: 'job_seeker' })
      .expect(201);
    const user = await User.findOne({ email: 't3@example.com' });
    const otp = user.otp;
    const v = await request(app).post('/api/auth/verify-otp').send({ email: user.email, otp }).expect(200);
    expect(v.body.accessToken).toBeTruthy();
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: 'Password1' }).expect(200);
    expect(login.body.refreshToken).toBeTruthy();
  });

  it('refreshes token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 't4@example.com', password: 'Password1', role: 'job_seeker' })
      .expect(201);
    const user = await User.findOne({ email: 't4@example.com' });
    const otp = user.otp;
    const v = await request(app).post('/api/auth/verify-otp').send({ email: user.email, otp }).expect(200);
    const refresh = v.body.refreshToken;
    const r = await request(app).post('/api/auth/refresh-token').set('Authorization', `Bearer ${refresh}`).send({}).expect(200);
    expect(r.body.accessToken).toBeTruthy();
  });

  it('forgot and reset password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 't5@example.com', password: 'Password1', role: 'job_seeker' })
      .expect(201);
    await request(app).post('/api/auth/forgot-password').send({ email: 't5@example.com' }).expect(200);
    const user = await User.findOne({ email: 't5@example.com' }).select('+resetPasswordToken');
    const token = user.resetPasswordToken;
    await request(app).post('/api/auth/reset-password').send({ token, password: 'Password2' }).expect(200);
    // login with new password should still require verification
    await request(app).post('/api/auth/login').send({ email: 't5@example.com', password: 'Password2' }).expect(403);
  });
});
