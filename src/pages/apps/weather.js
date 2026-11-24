import WeatherView from '@/components/WeatherView';
import useWeather from '@/hooks/useWeather';

export default function Weather() {
  const weather = useWeather();
  return <WeatherView weather={weather} />;
}
