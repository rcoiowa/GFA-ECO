// Only public, fixed-location weather belongs here. Auth and intake remain on CQCX.
const WEATHER_PATH = '/api/weather/des-moines';
const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=41.5868&longitude=-93.6250&current=temperature_2m,precipitation,rain,showers,snowfall,weather_code,cloud_cover,is_day&temperature_unit=fahrenheit&timeformat=unixtime&timezone=America%2FChicago&forecast_days=1';
const fields = [
  'time',
  'temperature_2m',
  'precipitation',
  'rain',
  'showers',
  'snowfall',
  'weather_code',
  'cloud_cover',
  'is_day',
];

function json(body, status = 200, cacheControl = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cacheControl,
      'x-content-type-options': 'nosniff',
    },
  });
}

export async function weatherResponse(request, env, cache, fetcher = fetch) {
  if (request.method !== 'GET')
    return new Response(null, {
      status: 405,
      headers: { Allow: 'GET', 'Cache-Control': 'no-store' },
    });
  // Enable only after documenting the feed's license for this use. No direct-browser fallback.
  if (env.WEATHER_ENABLED !== 'true') return json({ error: 'weather_unavailable' }, 503);
  const url = new URL(request.url);
  // Ignore caller query strings and headers. They cannot alter the upstream or fragment the cache.
  const key = new Request(`${url.origin}${WEATHER_PATH}`);
  try {
    const hit = await cache.match(key);
    if (hit) return hit;
    const response = await fetcher(WEATHER_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok || !response.body) throw new Error('upstream unavailable');
    // Bound the external response before parsing it.
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16384) throw new Error('upstream too large');
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const current = JSON.parse(new TextDecoder().decode(body)).current;
    if (
      !current ||
      !fields.every((field) => Number.isFinite(current[field])) ||
      ![0, 1].includes(current.is_day) ||
      Math.abs(Date.now() - current.time * 1000) > 30 * 60_000
    ) {
      throw new Error('invalid or stale weather');
    }
    const result = json(
      { current: Object.fromEntries(fields.map((field) => [field, current[field]])) },
      200,
      'public, max-age=300, s-maxage=900',
    );
    // Cache API is per data center, not a global provider quota guarantee.
    await cache.put(key, result.clone());
    return result;
  } catch {
    // Briefly cache failures as well, to avoid retrying upstream on every visit during an outage.
    const result = json({ error: 'weather_unavailable' }, 503, 'public, max-age=30');
    try {
      await cache.put(key, result.clone());
    } catch {
      /* Weather must not prevent the page loading. */
    }
    return result;
  }
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === WEATHER_PATH) {
      return weatherResponse(request, env, caches.default);
    }
    return env.ASSETS.fetch(request);
  },
};
