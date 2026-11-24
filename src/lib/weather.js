const WEATHER_CONDITIONS = [
  { codes: [0], label: 'Clear sky', icon: '☀️', nightIcon: '🌙' },
  { codes: [1], label: 'Mostly clear', icon: '🌤️', nightIcon: '🌙' },
  { codes: [2], label: 'Partly cloudy', icon: '⛅', nightIcon: '☁️' },
  { codes: [3], label: 'Overcast', icon: '☁️', nightIcon: '☁️' },
  { codes: [45, 48], label: 'Foggy', icon: '🌫️', nightIcon: '🌫️' },
  {
    codes: [51, 53, 55, 56, 57],
    label: 'Drizzle',
    icon: '🌦️',
    nightIcon: '🌧️',
  },
  {
    codes: [61, 63, 65, 66, 67, 80, 81, 82],
    label: 'Rain',
    icon: '🌧️',
    nightIcon: '🌧️',
  },
  {
    codes: [71, 73, 75, 77, 85, 86],
    label: 'Snow',
    icon: '🌨️',
    nightIcon: '🌨️',
  },
  { codes: [95, 96, 99], label: 'Thunderstorm', icon: '⛈️', nightIcon: '⛈️' },
];

export function getWeatherCondition(code, isDay = true) {
  const condition = WEATHER_CONDITIONS.find((item) =>
    item.codes.includes(code),
  );
  if (!condition) {
    return { label: 'Unknown conditions', icon: '🌡️' };
  }
  return {
    label: condition.label,
    icon: isDay ? condition.icon : condition.nightIcon,
  };
}

export function formatTemperature(celsius, unit) {
  if (typeof celsius !== 'number') return '—';
  const value = unit === 'F' ? (celsius * 9) / 5 + 32 : celsius;
  return `${Math.round(value)}°${unit}`;
}

export function formatWindSpeed(kilometersPerHour, unit) {
  if (typeof kilometersPerHour !== 'number') return '—';
  const value = unit === 'F' ? kilometersPerHour * 0.621371 : kilometersPerHour;
  return `${Math.round(value)} ${unit === 'F' ? 'mph' : 'km/h'}`;
}

export function formatForecastDay(dateString, index) {
  if (index === 0) return 'Tomorrow';
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(
    new Date(`${dateString}T12:00:00`),
  );
}
