const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../app');
const User = require('../models/User');

let mongo; let token;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
  } else {
    await mongoose.connection.db.dropDatabase();
  }
  const pw = await User.hashPassword('EmpPass123!');
  await User.create({ firstName:'Emp', lastName:'One', email:'emp1@test.com', username:'emp1', role:'employee', passwordHash: pw });
  const login = await request(app).post('/api/auth/login').send({ username:'emp1', password:'EmpPass123!' });
  token = login.body.token;
});

afterAll(async () => {
  if (mongo) { await mongoose.disconnect(); await mongo.stop(); }
});

describe('Attendance flow', () => {
  it('check-in works first time', async () => {
    const res = await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
  it('duplicate check-in blocked', async () => {
    const res = await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
  it('check-out works', async () => {
    const res = await request(app).post('/api/attendance/check-out').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.totalMs).toBeGreaterThanOrEqual(0);
  });
  it('duplicate check-out blocked', async () => {
    const res = await request(app).post('/api/attendance/check-out').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
