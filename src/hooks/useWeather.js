import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function useWeather() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const savedWeather = user?.preferences?.weather;
  const [unit, setUnit] = useState(savedWeather?.unit === 'F' ? 'F' : 'C');
  const [location, setLocation] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [error, setError] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (savedWeather?.unit === 'C' || savedWeather?.unit === 'F') {
      setUnit(savedWeather.unit);
    }
  }, [savedWeather?.unit]);

  const saveWeatherPreferences = useCallback(
    async (updates) => {
      if (!user) return;
      const preferences = {
        ...user.preferences,
        weather: { ...user.preferences?.weather, ...updates },
      };
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferences }),
      });
      if (!response.ok) {
        throw new Error(
          'Your weather preference could not be saved. It will reset on reload.',
        );
      }
      await refreshUser();
    },
    [user, refreshUser],
  );

  const loadWeather = useCallback(async (nextLocation) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        latitude: String(nextLocation.latitude),
        longitude: String(nextLocation.longitude),
      });
      const response = await fetch(`/api/weather?${params}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load the weather.');
      }
      setLocation(nextLocation);
      setForecast(data);
    } catch (loadError) {
      setError(
        loadError.message || 'Unable to load the weather. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    setError('');
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      setError(
        'Location is not supported by this browser. Search for a city instead.',
      );
      return;
    }

    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          name: 'Current location',
          city: 'Current location',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocationStatus('ready');
        loadWeather(nextLocation);
        saveWeatherPreferences(nextLocation).catch((preferenceError) => {
          setError(preferenceError.message);
        });
      },
      (locationError) => {
        setLocationStatus('denied');
        setError(
          locationError.code === 1
            ? 'Location access was denied. Search for a city instead.'
            : 'Your location could not be determined. Search for a city instead.',
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 900000 },
    );
  }, [loadWeather, saveWeatherPreferences]);

  useEffect(() => {
    if (initialized.current || authLoading) return;
    initialized.current = true;
    if (
      typeof savedWeather?.latitude === 'number' &&
      typeof savedWeather?.longitude === 'number'
    ) {
      loadWeather({
        name: savedWeather.city || 'Saved location',
        latitude: savedWeather.latitude,
        longitude: savedWeather.longitude,
      });
    } else {
      requestLocation();
    }
  }, [authLoading]);

  const searchCity = async (event) => {
    event.preventDefault();
    const query = cityQuery.trim();
    if (!query) return;

    setSearching(true);
    setError('');
    try {
      const response = await fetch(
        `/api/weather?city=${encodeURIComponent(query)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'City search is unavailable.');
      }
      setSearchResults(data.results || []);
    } catch (searchError) {
      setError(searchError.message || 'City search is unavailable.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (result) => {
    const nextLocation = {
      name: result.name,
      city: result.name,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
    };
    setCityQuery(result.name);
    setSearchResults([]);
    loadWeather(nextLocation);
    saveWeatherPreferences(nextLocation).catch((preferenceError) => {
      setError(preferenceError.message);
    });
  };

  const changeUnit = (nextUnit) => {
    if (nextUnit === unit) return;
    setUnit(nextUnit);
    // Keep the chosen unit even if saving fails — only show the error.
    saveWeatherPreferences({ unit: nextUnit }).catch((preferenceError) => {
      setError(preferenceError.message);
    });
  };

  const refresh = useCallback(() => {
    if (location) return loadWeather(location);
    requestLocation();
  }, [location, loadWeather, requestLocation]);

  return {
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
    refresh,
  };
}
