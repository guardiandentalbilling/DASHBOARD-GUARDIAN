const request = require('supertest');
const { init } = require('../server');

let app;

beforeAll(async () => {
  app = await init(false); // do not start listener
});

describe('Health endpoints', () => {
  test('/api/health returns OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });

  test('/health basic ping', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
