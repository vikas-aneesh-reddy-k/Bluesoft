import { useState, useEffect } from 'react';

interface WeatherData {
  weather_main: string;
  weather_description: string;
  precipitation: number;
  temperature: number;
  wind_speed: number;
}

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

type WeatherType = 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';

// Weather API service with Meteomatics (until cutoff) then Open-Meteo fallback
const WEATHER_API = {
  getCurrentWeather: async (lat: number, lon: number): Promise<WeatherData | null> => {
    try {
      const cutoff = new Date('2025-10-12T23:59:59Z');
      const username = (import.meta as any).env?.VITE_METEOMATICS_USERNAME || 'kakarla_vikas';
      const password = (import.meta as any).env?.VITE_METEOMATICS_PASSWORD || 'mW07QKj9y7ApKf23Ep43';

      const tryMeteomatics = async (): Promise<WeatherData | null> => {
        if (!username || !password) return null;
        const isoNow = new Date().toISOString().split('.')[0] + 'Z';
        const params = [
          't_2m:C',
          'wind_speed_10m:ms',
          'relative_humidity_2m:p',
          'precip_1h:mm',
          'weather_symbol_1h:idx'
        ].join(',');
        const url = `https://api.meteomatics.com/${isoNow}/${params}/${lat},${lon}/json`;
        const auth = btoa(`${username}:${password}`);
        const resp = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
        if (!resp.ok) {
          if (resp.status === 400) return null;
          throw new Error(`Meteomatics error: ${resp.status}`);
        }
        const mm = await resp.json();
        const getValue = (param: string) => {
          const entry = mm?.data?.find((d: any) => typeof d?.parameter === 'string' && d.parameter.startsWith(param));
          const val = entry?.coordinates?.[0]?.dates?.[0]?.value;
          return typeof val === 'number' ? val : null;
        };
        const temperature = getValue('t_2m');
        const windSpeed = getValue('wind_speed_10m');
        const humidity = getValue('relative_humidity_2m');
        const precip1h = getValue('precip_1h');
        const symbol = getValue('weather_symbol_1h');
        const mapSymbolToWeather = (sym: number | null, tempC: number | null, precip: number | null) => {
          if (sym != null) {
            const s = Math.round(sym);
            if (s === 1) return { main: 'Clear', desc: 'Clear sky' };
            if (s === 2) return { main: 'Clear', desc: 'Mostly sunny' };
            if (s === 3) return { main: 'Clouds', desc: 'Partly cloudy' };
            if (s === 4) return { main: 'Clouds', desc: 'Cloudy' };
            if (s === 5) return { main: 'Clouds', desc: 'Overcast' };
            if (s === 6) return { main: 'Rain', desc: 'Light rain' };
            if (s === 7) return { main: 'Rain', desc: 'Rain' };
            if (s === 8) return { main: 'Rain', desc: 'Heavy rain' };
            if (s === 9) return { main: 'Rain', desc: 'Rain showers' };
            if (s === 10) return { main: 'Snow', desc: 'Snow' };
            if (s === 11) return { main: 'Thunderstorm', desc: 'Thunderstorm' };
            if (s === 12) return { main: 'Fog', desc: 'Fog' };
          }
          const t = tempC ?? 20;
          const p = precip ?? 0;
          if (p >= 7) return { main: 'Rain', desc: 'Heavy rain' };
          if (p > 0.2 && t <= 2) return { main: 'Snow', desc: 'Snow' };
          if (p > 0.2) return { main: 'Rain', desc: 'Rain' };
          return { main: 'Clear', desc: 'Clear sky' };
        };
        let mapped = mapSymbolToWeather(symbol, temperature, precip1h);
        // Cross-check with Open-Meteo to reduce false 'Clear'
        try {
          const omResp = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,precipitation&timezone=auto`
          );
          if (omResp.ok) {
            const om = await omResp.json();
            const omCurrent = om?.current;
            const code = omCurrent?.weather_code;
            const omPrecip = omCurrent?.precipitation ?? 0;
            const mapOM = (c: number | null) => {
              if (c === 0) return { main: 'Clear', desc: 'Clear sky' };
              if (c != null && c <= 3) return { main: 'Clouds', desc: 'Partly cloudy' };
              if (c != null && c <= 48) return { main: 'Fog', desc: 'Fog' };
              if (c != null && c <= 67) return { main: 'Rain', desc: 'Rain' };
              if (c != null && c <= 77) return { main: 'Snow', desc: 'Snow' };
              if (c != null && c <= 82) return { main: 'Rain', desc: 'Heavy rain' };
              if (c != null && c <= 99) return { main: 'Thunderstorm', desc: 'Thunderstorm' };
              return mapped;
            };
            const omMapped = mapOM(typeof code === 'number' ? code : null);
            if (mapped.main === 'Clear' && omMapped.main !== 'Clear') {
              mapped = omMapped;
            }
            if (omPrecip > 0.2 && mapped.main === 'Clear') {
              mapped = { main: 'Rain', desc: 'Rain' } as any;
            }
          }
        } catch {}
        return {
          weather_main: mapped.main,
          weather_description: mapped.desc,
          precipitation: Math.round(((precip1h ?? 0) * 10)) / 10,
          temperature: Math.round((temperature ?? 20)),
          wind_speed: Math.round(((windSpeed ?? 2) * 10)) / 10,
        };
      };

      let dataFromMeteomatics: WeatherData | null = null;
      if (new Date() <= cutoff) {
        try {
          dataFromMeteomatics = await tryMeteomatics();
        } catch (e) {
          console.warn('Meteomatics request failed, will fallback to Open-Meteo', e);
        }
      }

      if (dataFromMeteomatics) return dataFromMeteomatics;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=precipitation&timezone=auto&past_days=1`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      const current = data.current;
      const hourly = data.hourly;
      
      // Calculate recent precipitation (last 3 hours)
      let recentPrecipitation = 0;
      if (hourly && hourly.precipitation && hourly.time) {
        const now = new Date();
        const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        
        for (let i = 0; i < hourly.time.length; i++) {
          const hourTime = new Date(hourly.time[i]);
          if (hourTime >= threeHoursAgo && hourTime <= now) {
            recentPrecipitation += hourly.precipitation[i] || 0;
          }
        }
      }
      
      // Map weather codes to descriptions
      const getWeatherDescription = (code: number) => {
        if (code === 0) return { main: 'Clear', description: 'Clear sky' };
        if (code <= 3) return { main: 'Clouds', description: 'Partly cloudy' };
        if (code <= 48) return { main: 'Fog', description: 'Foggy' };
        if (code <= 67) return { main: 'Rain', description: 'Rainy' };
        if (code <= 77) return { main: 'Snow', description: 'Snowy' };
        if (code <= 82) return { main: 'Rain', description: 'Heavy rain' };
        if (code <= 99) return { main: 'Thunderstorm', description: 'Thunderstorm' };
        return { main: 'Unknown', description: 'Unknown conditions' };
      };
      
      const weather = getWeatherDescription(current.weather_code);
      // Prefer immediate precipitation for "is it raining now" assessment
      const currentPrecip = typeof current.precipitation === 'number' ? current.precipitation : 0;
      let mainNow = weather.main as string;
      // If mapped as rain but virtually no precip now and in last 3h, downgrade to clouds/clear
      if (mainNow === 'Rain' && currentPrecip < 0.2 && recentPrecipitation < 0.2) {
        const cloud = typeof current.cloud_cover === 'number' ? current.cloud_cover : undefined;
        mainNow = cloud != null && cloud >= 60 ? 'Clouds' : 'Clear';
      }
      
      return {
        weather_main: mainNow,
        weather_description: weather.description,
        precipitation: Math.round(Math.max(currentPrecip, recentPrecipitation) * 10) / 10,
        temperature: Math.round(current.temperature_2m),
        wind_speed: Math.round(current.wind_speed_10m * 10) / 10,
      };
    } catch (error) {
      console.error('Failed to fetch real weather data:', error);
      return null;
    }
  }
};

// Function to determine weather type based on weather data
const determineWeatherType = (weatherData: WeatherData): WeatherType => {
  const { weather_main, precipitation, wind_speed, temperature } = weatherData;
  
  // Thunderstorm conditions
  if (weather_main === 'Thunderstorm' || (precipitation > 5 && wind_speed > 15)) {
    return 'stormy';
  }
  
  // Snow conditions
  if (weather_main === 'Snow' || (temperature < 2 && precipitation > 0)) {
    return 'snowy';
  }
  
  // Rain conditions
  if (weather_main === 'Rain' || precipitation > 1) {
    return 'rainy';
  }
  
  // Cloudy conditions
  if (weather_main === 'Clouds' || weather_main === 'Fog') {
    return 'cloudy';
  }
  
  // Clear conditions (default)
  return 'clear';
};

export function useAutoWeather(location: Location | null) {
  const [weatherType, setWeatherType] = useState<WeatherType>('clear');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!location) {
      setWeatherType('clear');
      return;
    }

    const fetchWeather = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const weatherData = await WEATHER_API.getCurrentWeather(location.lat, location.lng);
        
        if (weatherData) {
          const newWeatherType = determineWeatherType(weatherData);
          setWeatherType(newWeatherType);
          setLastUpdate(new Date());
          
          console.log('Auto weather update:', {
            location: location.name || `${location.lat}, ${location.lng}`,
            weather_main: weatherData.weather_main,
            precipitation: weatherData.precipitation,
            wind_speed: weatherData.wind_speed,
            temperature: weatherData.temperature,
            determined_type: newWeatherType
          });
        } else {
          // Fallback to clear weather if API fails
          setWeatherType('clear');
          setError('Failed to fetch weather data');
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError('Failed to fetch weather data');
        setWeatherType('clear');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
    
    // Update weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [location]);

  return {
    weatherType,
    isLoading,
    error,
    lastUpdate,
    // Manual override function for testing
    setWeatherType: (type: WeatherType) => {
      setWeatherType(type);
      setLastUpdate(new Date());
    }
  };
}
