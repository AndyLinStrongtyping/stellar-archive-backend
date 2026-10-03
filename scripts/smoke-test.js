const assert = require('node:assert/strict');

const apiBase = (process.env.API_URL || 'http://localhost:3010/api').replace(/\/$/, '');

async function get(path) {
  const response = await fetch(`${apiBase}${path}`);
  const payload = await response.json().catch(() => ({}));
  assert.equal(response.status, 200, `${path} returned ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}

async function run() {
  const health = await get('/health');
  const galaxies = await get('/galaxies');
  const planets = await get('/planets');

  assert.equal(health.data?.status, 'ok', 'health payload is not ok');
  assert.ok(Array.isArray(galaxies.data) && galaxies.data.length > 0, 'galaxies is empty');
  assert.ok(Array.isArray(planets.data) && planets.data.length > 0, 'planets is empty');

  const sample = planets.data[0];
  const planet = await get(`/planets/${encodeURIComponent(sample.id)}`);
  const search = await get(`/planets/search?keyword=${encodeURIComponent(sample.name)}`);

  assert.equal(planet.data?.id, sample.id, 'single planet does not match catalog');
  assert.ok(search.data.some((item) => item.id === sample.id), 'search did not return the sample planet');

  console.log(JSON.stringify({
    status: 'ok',
    apiBase,
    sourceCommit: health.data.sourceCommit,
    galaxyCount: galaxies.data.length,
    planetCount: planets.data.length,
    verifiedPlanet: sample.id,
  }, null, 2));
}

run().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exit(1);
});
