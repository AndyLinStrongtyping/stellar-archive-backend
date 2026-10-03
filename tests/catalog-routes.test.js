const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const jwt = require('jsonwebtoken');

const app = require('../app');
const { pool } = require('../db/pg');

const originalQuery = pool.query;
const originalSecret = process.env.JWT_SECRET;
let server;
let baseUrl;

const restoreJwtSecret = () => {
  if (originalSecret === undefined) {
    delete process.env.JWT_SECRET;
    return;
  }
  process.env.JWT_SECRET = originalSecret;
};

const sampleGalaxy = {
  id: 'code',
  name: '程式星系',
  en: 'CODE CLUSTER',
  color: '#93c3d8',
  desc: '除錯、重構、架構設計的技能航線',
};

const samplePlanet = {
  id: 'p6',
  galaxy: 'code',
  type: 'skill',
  name: '除錯羅盤',
  en: 'Debug Compass',
  coord: 'CD-102',
  difficulty: 3,
  uses: 1840,
  summary: '從錯誤訊息反推根因',
  body: '列出最可能的根因與驗證步驟',
  author: 'Stellar Archive Team',
  sourceUrl: null,
  license: '未指定',
  compatibleAgents: ['ChatGPT', 'Claude', 'Gemini'],
  version: '1.0.0',
  updatedAt: '2026-10-03T00:00:00.000Z',
};

test.before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  pool.query = originalQuery;
  restoreJwtSecret();
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test.afterEach(() => {
  pool.query = originalQuery;
  restoreJwtSecret();
});

test('catalog routes return galaxies and metadata-rich planets', async () => {
  pool.query = async (sql) => {
    if (sql.includes('FROM galaxies')) return { rows: [sampleGalaxy], rowCount: 1 };
    if (sql.includes('FROM planets')) return { rows: [samplePlanet], rowCount: 1 };
    throw new Error(`Unexpected query: ${sql}`);
  };

  const [galaxiesResponse, planetsResponse] = await Promise.all([
    fetch(`${baseUrl}/api/galaxies`),
    fetch(`${baseUrl}/api/planets`),
  ]);

  assert.equal(galaxiesResponse.status, 200);
  assert.equal(planetsResponse.status, 200);

  const galaxies = await galaxiesResponse.json();
  const planets = await planetsResponse.json();
  assert.deepEqual(galaxies.data, [sampleGalaxy]);
  assert.equal(planets.data[0].author, 'Stellar Archive Team');
  assert.deepEqual(planets.data[0].compatibleAgents, ['ChatGPT', 'Claude', 'Gemini']);
});

test('search returns the requested Skill with parameterized input', async () => {
  let capturedValues;
  pool.query = async (sql, values) => {
    assert.match(sql, /ILIKE \$1/);
    capturedValues = values;
    return { rows: [samplePlanet], rowCount: 1 };
  };

  const response = await fetch(`${baseUrl}/api/planets/search?keyword=${encodeURIComponent('除錯')}`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(capturedValues, ['%除錯%']);
  assert.equal(payload.data[0].id, 'p6');
});

test('catalog database errors return a controlled response', async () => {
  pool.query = async () => {
    const error = new Error('SELECT secret FROM production_table');
    error.code = 'XX000';
    throw error;
  };

  const response = await fetch(`${baseUrl}/api/galaxies`);
  const payload = await response.json();

  assert.equal(response.status, 500);
  assert.deepEqual(payload, { message: '伺服器發生錯誤' });
  assert.doesNotMatch(JSON.stringify(payload), /production_table/);
});

test('favorites require authentication', async () => {
  const response = await fetch(`${baseUrl}/api/favorites`);
  assert.equal(response.status, 401);
});

test('a regular member cannot access admin routes', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const token = jwt.sign({ id: 'user-a', role: 'user' }, process.env.JWT_SECRET);
  const response = await fetch(`${baseUrl}/api/admin/galaxies`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(response.status, 403);
});

test('favorites query is isolated to the authenticated user', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const queriedUserIds = [];
  pool.query = async (sql, values) => {
    assert.match(sql, /WHERE f\.user_id = \$1/);
    queriedUserIds.push(values[0]);
    return { rows: [], rowCount: 0 };
  };

  for (const userId of ['user-a', 'user-b']) {
    const token = jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET);
    const response = await fetch(`${baseUrl}/api/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200);
  }

  assert.deepEqual(queriedUserIds, ['user-a', 'user-b']);
});
