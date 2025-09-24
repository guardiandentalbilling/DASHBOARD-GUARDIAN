const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, init } = require('../app');
const User = require('../models/User');

let mongo;

beforeAll(async () => {
  // If already connected (another test suite established a connection) reuse it, else spin up memory server
  if (mongoose.connection.readyState === 0) {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
  }
  // Ensure indexes & middleware are initialized (init normally connects, but we already connected so just call for any side-effects)
  if (typeof init === 'function') {
    try { await init(); } catch(e) { /* ignore since we manually connected to memory server */ }
  }
  // Ensure a clean database state for this suite
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  const passwordHash = await User.hashPassword('AdminPass123!');
  await User.create({ firstName:'Test', lastName:'Admin', email:'admin@test.com', username:'admin', role:'admin', passwordHash });
});

afterAll(async () => {
  // Do not disconnect if other test files may still run; jest will exit after suites complete.
  if (mongo) {
    await mongoose.disconnect();
    await mongo.stop();
  }
});

describe('Auth Login', () => {
  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'AdminPass123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});
