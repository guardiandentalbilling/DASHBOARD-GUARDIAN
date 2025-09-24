#!/usr/bin/env node

/**
 * Test script to verify API endpoints after Railway deployment
 * Usage: node test-railway-api.js
 */

const https = require('https');

const BASE_URL = 'https://dashboard-guardian-production.up.railway.app';

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Railway-Test/1.0'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Railway API Deployment...\n');
  
  // Test 1: Health Check
  console.log('1. Testing /health endpoint...');
  try {
    const health = await testEndpoint('/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response:`, health.data);
    if (health.status === 200 && health.data?.status === 'ok') {
      console.log('   ✅ Health check passed\n');
    } else {
      console.log('   ❌ Health check failed\n');
    }
  } catch (err) {
    console.log(`   ❌ Health check error: ${err.message}\n`);
  }

  // Test 2: Auth Login
  console.log('2. Testing /api/auth/login endpoint...');
  try {
    const login = await testEndpoint('/api/auth/login', 'POST', {
      username: 'shakeel',
      password: 'AdminPass123!'
    });
    console.log(`   Status: ${login.status}`);
    console.log(`   Response:`, login.data);
    if (login.status === 200 && login.data?.token) {
      console.log('   ✅ Login successful\n');
    } else {
      console.log('   ❌ Login failed\n');
    }
  } catch (err) {
    console.log(`   ❌ Login error: ${err.message}\n`);
  }

  // Test 3: Root endpoint (should NOT return HTML dashboard)
  console.log('3. Testing root endpoint (should be API, not HTML)...');
  try {
    const root = await testEndpoint('/');
    console.log(`   Status: ${root.status}`);
    const isHtml = typeof root.data === 'string' && root.data.includes('<html');
    if (isHtml) {
      console.log('   ❌ Still serving HTML dashboard (old deployment)\n');
    } else {
      console.log('   ✅ API server is responding (not HTML)\n');
    }
  } catch (err) {
    console.log(`   ❌ Root endpoint error: ${err.message}\n`);
  }

  console.log('🏁 Test complete!');
}

runTests().catch(console.error);