const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../app');
const User = require('../models/User');
const Loan = require('../models/Loan');

let mongo;
let adminToken; let employeeToken; let employeeUser; let loanId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
  } else {
    // drop existing DB for clean slate
    await mongoose.connection.db.dropDatabase();
  }
  const adminHash = await User.hashPassword('AdminPass123!');
  const empHash = await User.hashPassword('EmpPass123!');
  await User.create({ firstName:'Admin', lastName:'User', email:'admin@test.com', username:'admin', role:'admin', passwordHash: adminHash });
  employeeUser = await User.create({ firstName:'Emp', lastName:'User', email:'emp@test.com', username:'emp1', role:'employee', passwordHash: empHash });
  // login admin
  const adminRes = await request(app).post('/api/auth/login').send({ username:'admin', password:'AdminPass123!' });
  adminToken = adminRes.body.token;
  const empRes = await request(app).post('/api/auth/login').send({ username:'emp1', password:'EmpPass123!' });
  employeeToken = empRes.body.token;
});

afterAll(async () => {
  if (mongo) {
    await mongoose.disconnect();
    await mongo.stop();
  }
});

describe('Loan workflow', () => {
  it('employee can create a loan request', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ amount: 500, reason: 'Medical' });
    expect(res.status).toBe(201);
    expect(res.body.loan).toBeDefined();
    loanId = res.body.loan._id;
  });

  it('admin can approve a loan request', async () => {
    const res = await request(app)
      .patch(`/api/loans/${loanId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.loan.status).toBe('approved');
  });

  it('list loans shows updated status', async () => {
    const res = await request(app)
      .get('/api/loans')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const found = res.body.loans.find(l => l._id === loanId || l._id === loanId?.toString());
    expect(found).toBeTruthy();
  });
});
