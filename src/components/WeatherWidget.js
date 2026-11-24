import { useApp } from '@/context/AppContext';
import WeatherApp from '@/system/apps/WeatherApp';
import useWeather from '@/hooks/useWeather';
import WeatherView from './WeatherView';
import Widget from './Widget';

const REFRESH_INTERVAL = 15 * 60 * 1000;

export default function WeatherWidget() {
  const { dispatch } = useApp();
  const weather = useWeather();
  const openWeather = () => {
    dispatch({ type: 'OPEN_APP', payload: WeatherApp });
    dispatch({ type: 'SET_ACTIVE_APP', payload: WeatherApp.id });
  };

  return (
    <Widget
      id="weather"
      title="Weather"
      icon="⛅"
      defaultPosition={() => ({
        x: Math.max(16, window.innerWidth - 356),
        y: 72,
      })}
      defaultSize={{ width: 340, height: 540 }}
      minSize={{ width: 300, height: 440 }}
      refreshInterval={REFRESH_INTERVAL}
      onRefresh={weather.refresh}
      onOpen={openWeather}
    >
      <WeatherView weather={weather} compact onOpen={openWeather} />
    </Widget>
  );
}
