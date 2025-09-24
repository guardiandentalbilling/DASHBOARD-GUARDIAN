const request = require('supertest');
const { init } = require('../server');

describe('Health Endpoints', () => {
  let app;
  beforeAll(async () => {
    // Initialize without starting actual listener
    app = await init(false);
  });

  test('/health basic', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
  });

  test('/api/health extended', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('mongoConnected');
  });
});
