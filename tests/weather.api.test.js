import handler from '@/pages/api/weather';

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  };
}

const forecast = {
  current: { temperature_2m: 20 },
  daily: { time: ['2026-11-24'] },
};

describe('/api/weather', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('only accepts GET requests', async () => {
    const res = createResponse();
    await handler({ method: 'POST', query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'GET');
  });

  it('validates forecast coordinates', async () => {
    const res = createResponse();
    await handler(
      { method: 'GET', query: { latitude: '100', longitude: '20' } },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns Open-Meteo forecasts and caches them for 15 minutes', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(forecast),
    });
    const request = {
      method: 'GET',
      query: { latitude: '51.5072', longitude: '-0.1276' },
    };
    const firstResponse = createResponse();
    const secondResponse = createResponse();

    await handler(request, firstResponse);
    await handler(request, secondResponse);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toContain(
      'api.open-meteo.com/v1/forecast',
    );
    expect(global.fetch.mock.calls[0][0]).toContain('forecast_days=6');
    expect(firstResponse.status).toHaveBeenCalledWith(200);
    expect(firstResponse.json).toHaveBeenCalledWith(forecast);
    expect(firstResponse.setHeader).toHaveBeenCalledWith(
      'X-Weather-Cache',
      'MISS',
    );
    expect(secondResponse.setHeader).toHaveBeenCalledWith(
      'X-Weather-Cache',
      'HIT',
    );
    expect(secondResponse.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=900, s-maxage=900, stale-while-revalidate=300',
    );
  });

  it('returns normalized city search results from Open-Meteo geocoding', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        results: [
          {
            id: 2643743,
            name: 'London',
            latitude: 51.50853,
            longitude: -0.12574,
            country: 'United Kingdom',
            country_code: 'GB',
            admin1: 'England',
            timezone: 'Europe/London',
          },
        ],
      }),
    });
    const res = createResponse();

    await handler({ method: 'GET', query: { city: 'London' } }, res);

    expect(global.fetch.mock.calls[0][0]).toContain(
      'geocoding-api.open-meteo.com/v1/search',
    );
    expect(res.json).toHaveBeenCalledWith({
      results: [
        {
          id: 2643743,
          name: 'London',
          latitude: 51.50853,
          longitude: -0.12574,
          country: 'United Kingdom',
          countryCode: 'GB',
          admin1: 'England',
          timezone: 'Europe/London',
        },
      ],
    });
  });

  it('returns a graceful error when Open-Meteo is unavailable', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    global.fetch.mockRejectedValue(new Error('Network unavailable'));
    const res = createResponse();

    await handler(
      { method: 'GET', query: { latitude: '40', longitude: '-73' } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Weather is temporarily unavailable. Please try again.',
    });
    consoleError.mockRestore();
  });
});
