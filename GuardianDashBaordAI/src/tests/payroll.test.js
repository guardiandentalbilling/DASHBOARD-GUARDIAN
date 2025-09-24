const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../app');
const User = require('../models/User');

let mongo; let adminToken;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
  } else {
    await mongoose.connection.db.dropDatabase();
  }
  const pw = await User.hashPassword('AdminPass123!');
  await User.create({ firstName:'Admin', lastName:'One', email:'admin@test.com', username:'admin', role:'admin', passwordHash: pw, baseMonthlySalary: 500 });
  // Two employees for payroll aggregation
  const e1 = await User.hashPassword('e1pass123');
  const e2 = await User.hashPassword('e2pass123');
  await User.create({ firstName:'Emp', lastName:'A', email:'a@test.com', username:'empa', role:'employee', passwordHash: e1, baseMonthlySalary: 300 });
  await User.create({ firstName:'Emp', lastName:'B', email:'b@test.com', username:'empb', role:'employee', passwordHash: e2, baseMonthlySalary: 400 });
  const login = await request(app).post('/api/auth/login').send({ username:'admin', password:'AdminPass123!' });
  adminToken = login.body.token;
});

afterAll(async () => {
  if (mongo) { await mongoose.disconnect(); await mongo.stop(); }
});

describe('Payroll cache summary', () => {
  it('first call produces summary without cached flag', async () => {
    const res = await request(app).get('/api/payroll/summary').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.cached).toBeUndefined();
    expect(res.body.lifetime).toBeGreaterThan(0);
  });
  it('second immediate call returns cached summary', async () => {
    const res = await request(app).get('/api/payroll/summary').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(true);
  });
});
