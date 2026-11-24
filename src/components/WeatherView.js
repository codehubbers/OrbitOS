import { useTheme } from '@/context/ThemeContext';
import {
  formatForecastDay,
  formatTemperature,
  formatWindSpeed,
  getWeatherCondition,
} from '@/lib/weather';

export default function WeatherView({ weather, compact = false, onOpen }) {
  const { theme } = useTheme();
  const {
    unit,
    location,
    forecast,
    loading,
    locationStatus,
    error,
    cityQuery,
    setCityQuery,
    searchResults,
    searching,
    searchCity,
    selectLocation,
    requestLocation,
    changeUnit,
  } = weather;
  const current = forecast?.current;
  const condition = current
    ? getWeatherCondition(current.weather_code, current.is_day === 1)
    : null;
  const forecastDays = forecast?.daily
    ? forecast.daily.time.slice(1, 6).map((date, index) => ({
        date,
        code: forecast.daily.weather_code[index + 1],
        high: forecast.daily.temperature_2m_max[index + 1],
        low: forecast.daily.temperature_2m_min[index + 1],
      }))
    : [];

  return (
    <div
      className={`${compact ? 'bg-slate-900/85 text-white' : `${theme.app.bg} ${theme.app.text}`} h-full overflow-y-auto p-4`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className={`${compact ? 'text-base' : 'text-xl'} font-semibold`}>
            {location?.name || 'Weather'}
          </h2>
          {location?.country && (
            <p
              className={`text-xs ${compact ? 'text-slate-300' : theme.app.text_subtle}`}
            >
              {location.country}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`flex rounded-md p-0.5 ${compact ? 'bg-white/10' : 'bg-gray-200'}`}
            aria-label="Temperature unit"
          >
            {['C', 'F'].map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={unit === item}
                onClick={() => changeUnit(item)}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  unit === item
                    ? 'bg-blue-500 text-white'
                    : compact
                      ? 'text-slate-200 hover:bg-white/10'
                      : 'text-gray-600 hover:bg-gray-300'
                }`}
              >
                °{item}
              </button>
            ))}
          </div>
          {onOpen && (
            <button
              type="button"
              onClick={onOpen}
              className="rounded px-2 py-1 text-xs text-blue-300 hover:bg-white/10"
            >
              Open
            </button>
          )}
        </div>
      </div>

      <form onSubmit={searchCity} className="relative mt-3">
        <div className="flex gap-2">
          <input
            type="search"
            value={cityQuery}
            onChange={(event) => setCityQuery(event.target.value)}
            placeholder="Search for a city"
            aria-label="Search for a city"
            className={`min-w-0 flex-1 rounded-md border px-3 py-1.5 text-sm ${
              compact
                ? 'border-white/20 bg-white/10 text-white placeholder-slate-300'
                : theme.app.input
            }`}
          />
          <button
            type="submit"
            disabled={searching || !cityQuery.trim()}
            className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>
        {searchResults.length > 0 && (
          <ul
            className={`absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-md border shadow-lg ${
              compact ? 'border-white/20 bg-slate-800' : theme.app.dropdown_bg
            }`}
            aria-label="City search results"
          >
            {searchResults.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  onClick={() => selectLocation(result)}
                  className={`w-full px-3 py-2 text-left text-sm ${
                    compact
                      ? 'hover:bg-white/10'
                      : theme.app.dropdown_item_hover
                  }`}
                >
                  <span className="font-medium">{result.name}</span>
                  <span
                    className={
                      compact ? 'text-slate-300' : theme.app.text_subtle
                    }
                  >
                    {result.admin1 ? `, ${result.admin1}` : ''}
                    {result.country ? `, ${result.country}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      <button
        type="button"
        onClick={requestLocation}
        className={`mt-2 text-xs ${compact ? 'text-blue-300' : 'text-blue-600'} hover:underline`}
      >
        Use my current location
      </button>

      {error && (
        <p
          role="alert"
          className={`mt-3 rounded-md px-3 py-2 text-sm ${
            compact ? 'bg-red-400/20 text-red-100' : 'bg-red-50 text-red-700'
          }`}
        >
          {error}
        </p>
      )}

      {(loading || locationStatus === 'locating') && !current && (
        <p className="py-12 text-center text-sm" role="status">
          {locationStatus === 'locating'
            ? 'Finding your location…'
            : 'Loading weather…'}
        </p>
      )}

      {current && condition && (
        <>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-blue-500/15 p-4">
            <div>
              <div
                className={`${compact ? 'text-4xl' : 'text-5xl'} font-light`}
              >
                {formatTemperature(current.temperature_2m, unit)}
              </div>
              <p className="mt-1 text-sm font-medium">{condition.label}</p>
              <p
                className={`mt-1 text-xs ${compact ? 'text-slate-300' : theme.app.text_subtle}`}
              >
                Feels like{' '}
                {formatTemperature(current.apparent_temperature, unit)}
              </p>
            </div>
            <span
              className={`${compact ? 'text-5xl' : 'text-6xl'}`}
              role="img"
              aria-label={condition.label}
            >
              {condition.icon}
            </span>
          </div>

          <div
            className={`mt-3 grid grid-cols-3 gap-2 text-center text-xs ${compact ? 'text-slate-200' : ''}`}
          >
            <div
              className={`rounded-lg p-2 ${compact ? 'bg-white/5' : theme.app.table}`}
            >
              <p className={compact ? 'text-slate-300' : theme.app.text_subtle}>
                Humidity
              </p>
              <p className="mt-1 font-semibold">
                {current.relative_humidity_2m}%
              </p>
            </div>
            <div
              className={`rounded-lg p-2 ${compact ? 'bg-white/5' : theme.app.table}`}
            >
              <p className={compact ? 'text-slate-300' : theme.app.text_subtle}>
                Wind
              </p>
              <p className="mt-1 font-semibold">
                {formatWindSpeed(current.wind_speed_10m, unit)}
              </p>
            </div>
            <div
              className={`rounded-lg p-2 ${compact ? 'bg-white/5' : theme.app.table}`}
            >
              <p className={compact ? 'text-slate-300' : theme.app.text_subtle}>
                Precipitation
              </p>
              <p className="mt-1 font-semibold">{current.precipitation} mm</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">5-day forecast</h3>
              {loading && (
                <span className="text-xs" role="status">
                  Refreshing…
                </span>
              )}
            </div>
            <div className={compact ? 'space-y-1' : 'grid grid-cols-5 gap-2'}>
              {forecastDays.map((day, index) => {
                const dayCondition = getWeatherCondition(day.code);
                return (
                  <div
                    key={day.date}
                    aria-label={`Forecast for ${formatForecastDay(day.date, index)}`}
                    className={`flex items-center rounded-lg text-xs ${
                      compact
                        ? 'justify-between bg-white/5 px-3 py-1.5'
                        : 'flex-col gap-1 bg-blue-500/5 p-2 text-center'
                    }`}
                  >
                    <span className="font-medium">
                      {formatForecastDay(day.date, index)}
                    </span>
                    <span role="img" aria-label={dayCondition.label}>
                      {dayCondition.icon}
                    </span>
                    <span>
                      {formatTemperature(day.high, unit)}{' '}
                      <span
                        className={
                          compact ? 'text-slate-400' : theme.app.text_subtle
                        }
                      >
                        {formatTemperature(day.low, unit)}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
