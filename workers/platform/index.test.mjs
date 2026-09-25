import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { weatherResponse } from './index.mjs';

const current = () => ({
  time: Date.now() / 1000,
  temperature_2m: 67.6,
  precipitation: 0,
  rain: 0,
  showers: 0,
  snowfall: 0,
  weather_code: 3,
  cloud_cover: 80,
  is_day: 1,
});
function memoryCache() {
  const values = new Map();
  return {
    async match(key) {
      return values.get(key.url)?.clone();
    },
    async put(key, value) {
      values.set(key.url, value.clone());
    },
  };
}
const request = (query = '') => new Request(`https://example.com/api/weather/des-moines${query}`);

test('disabled weather makes no upstream requests', async () => {
  const result = await weatherResponse(request(), {}, memoryCache(), () => {
    throw Error('unexpected fetch');
  });
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('cache-control'), 'no-store');
});
test('query variants share one cached response and never forward visitor data', async () => {
  let count = 0;
  const cache = memoryCache();
  const fetcher = async (url, options) => {
    count++;
    assert.equal(new URL(url).hostname, 'api.open-meteo.com');
    assert.equal(new URL(url).searchParams.get('latitude'), '41.5868');
    assert.equal(options.headers, undefined);
    return Response.json({ current: { ...current(), secret: 'not returned' } });
  };
  const first = await weatherResponse(
    request('?latitude=0'),
    { WEATHER_ENABLED: 'true' },
    cache,
    fetcher,
  );
  const second = await weatherResponse(
    request('?random=2'),
    { WEATHER_ENABLED: 'true' },
    cache,
    fetcher,
  );
  assert.equal(count, 1);
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), await second.json());
  assert.equal(first.headers.get('cache-control'), 'public, max-age=300, s-maxage=900');
});
test('bad, stale, oversized and failed upstream responses become honest unavailable responses', async () => {
  for (const result of [
    Response.json({ current: { ...current(), time: 1 } }),
    Response.json({ current: null }),
    Response.json({ current: { ...current(), rain: null } }),
    new Response('x'.repeat(20000)),
    new Response('', { status: 429 }),
  ]) {
    const response = await weatherResponse(
      request(),
      { WEATHER_ENABLED: 'true' },
      memoryCache(),
      async () => result,
    );
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'weather_unavailable' });
  }
});
test('outages are briefly cached', async () => {
  let count = 0;
  const cache = memoryCache();
  const fetcher = async () => {
    count++;
    throw Error('offline');
  };
  await weatherResponse(request(), { WEATHER_ENABLED: 'true' }, cache, fetcher);
  const second = await weatherResponse(request(), { WEATHER_ENABLED: 'true' }, cache, fetcher);
  assert.equal(count, 1);
  assert.equal(second.status, 503);
});
test('weather endpoint rejects writes', async () => {
  const response = await weatherResponse(
    new Request(request(), { method: 'POST' }),
    { WEATHER_ENABLED: 'true' },
    memoryCache(),
  );
  assert.equal(response.status, 405);
});
test('non-weather requests preserve the static asset handler', async () => {
  const input = new Request('https://example.com/community-center');
  const result = await worker.fetch(input, {
    ASSETS: {
      fetch(request) {
        assert.equal(request, input);
        return new Response('app');
      },
    },
  });
  assert.equal(await result.text(), 'app');
});
