import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Weather from '@/pages/apps/weather';

const mockRefreshUser = jest.fn();
const mockUser = {
  preferences: {
    theme: 'light',
    weather: { unit: 'C' },
  },
};

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, refreshUser: mockRefreshUser }),
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      app: {
        bg: 'bg-white',
        text: 'text-black',
        text_subtle: 'text-gray-500',
        input: 'border',
        dropdown_bg: 'bg-white',
        dropdown_item_hover: 'hover:bg-blue-500',
        table: 'bg-white',
      },
    },
  }),
}));

const forecast = {
  current: {
    temperature_2m: 20,
    apparent_temperature: 19,
    relative_humidity_2m: 60,
    precipitation: 0,
    weather_code: 0,
    is_day: 1,
    wind_speed_10m: 10,
  },
  daily: {
    time: [
      '2026-11-24',
      '2026-11-25',
      '2026-11-26',
      '2026-11-27',
      '2026-11-28',
      '2026-11-29',
    ],
    weather_code: [0, 1, 2, 3, 61, 71],
    temperature_2m_max: [21, 22, 23, 24, 25, 26],
    temperature_2m_min: [11, 12, 13, 14, 15, 16],
  },
};

describe('Weather app', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: jest.fn((success, error) => error({ code: 1 })),
      },
    });
    global.fetch = jest.fn((url) => {
      if (url === '/api/users/preferences') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (url.startsWith('/api/weather?city=')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  id: 1,
                  name: 'London',
                  latitude: 51.5072,
                  longitude: -0.1276,
                  country: 'United Kingdom',
                },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(forecast),
      });
    });
  });

  it('handles denied location, finds a city, shows five days, and saves °F', async () => {
    render(<Weather />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Location access was denied. Search for a city instead.',
    );

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search for a city' }),
      {
        target: { value: 'London' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.click(
      await screen.findByRole('button', { name: /London.*United Kingdom/ }),
    );

    expect(await screen.findByText('20°C')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^Forecast for /)).toHaveLength(5);
    expect(
      screen.getByRole('heading', { name: '5-day forecast' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '°F' }));

    expect(screen.getByText('68°F')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(() => {
      const preferenceCalls = global.fetch.mock.calls.filter(
        ([url]) => url === '/api/users/preferences',
      );
      const lastRequest = preferenceCalls[preferenceCalls.length - 1][1];
      expect(JSON.parse(lastRequest.body)).toEqual({
        preferences: {
          theme: 'light',
          weather: { unit: 'F' },
        },
      });
    });
  });

  it('keeps the chosen unit when saving the preference fails', async () => {
    global.fetch = jest.fn((url) => {
      if (url === '/api/users/preferences') {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Database error' }),
        });
      }
      if (url.startsWith('/api/weather?city=')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  id: 1,
                  name: 'London',
                  latitude: 51.5072,
                  longitude: -0.1276,
                  country: 'United Kingdom',
                },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(forecast),
      });
    });

    render(<Weather />);

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search for a city' }),
      {
        target: { value: 'London' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.click(
      await screen.findByRole('button', { name: /London.*United Kingdom/ }),
    );

    expect(await screen.findByText('20°C')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '°F' }));

    // The save fails, but the unit must not roll back to °C…
    expect(await screen.findByText('68°F')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Your weather preference could not be saved. It will reset on reload.',
      );
    });
    expect(screen.getByText('68°F')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
