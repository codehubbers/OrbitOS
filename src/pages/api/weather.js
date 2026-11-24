const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;
const responseCache = new Map();

function setCacheHeaders(res, cacheStatus) {
  res.setHeader(
    'Cache-Control',
    'public, max-age=900, s-maxage=900, stale-while-revalidate=300',
  );
  res.setHeader('X-Weather-Cache', cacheStatus);
}

function cacheResponse(key, value) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    responseCache.delete(responseCache.keys().next().value);
  }
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo returned ${response.status}`);
  }
  return response.json();
}

async function searchCities(city) {
  const key = `city:${city.trim().toLowerCase()}`;
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { data: cached.value, cacheStatus: 'HIT' };
  }

  const params = new URLSearchParams({
    name: city.trim(),
    count: '5',
    language: 'en',
    format: 'json',
  });
  const data = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`,
  );
  const result = {
    results: (data.results || []).map((result) => ({
      id: result.id,
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      country: result.country,
      countryCode: result.country_code,
      admin1: result.admin1,
      timezone: result.timezone,
    })),
  };
  cacheResponse(key, result);
  return { data: result, cacheStatus: 'MISS' };
}

async function getForecast(latitude, longitude) {
  const key = `forecast:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { data: cached.value, cacheStatus: 'HIT' };
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    forecast_days: '6',
    timezone: 'auto',
    temperature_unit: 'celsius',
  });
  const data = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?${params}`,
  );
  cacheResponse(key, data);
  return { data, cacheStatus: 'MISS' };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { city, latitude, longitude } = req.query;

  try {
    if (city !== undefined) {
      if (typeof city !== 'string' || !city.trim() || city.length > 100) {
        return res.status(400).json({ error: 'Enter a valid city name.' });
      }
      const { data, cacheStatus } = await searchCities(city);
      setCacheHeaders(res, cacheStatus);
      return res.status(200).json(data);
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    if (
      typeof latitude !== 'string' ||
      typeof longitude !== 'string' ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return res.status(400).json({
        error: 'Valid latitude and longitude coordinates are required.',
      });
    }

    const { data, cacheStatus } = await getForecast(lat, lon);
    setCacheHeaders(res, cacheStatus);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Weather API error:', error);
    return res.status(502).json({
      error: 'Weather is temporarily unavailable. Please try again.',
    });
  }
}
