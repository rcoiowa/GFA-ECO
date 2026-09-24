import { useEffect, useState } from 'react';

const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=41.5868&longitude=-93.6250&current=temperature_2m,precipitation,rain,showers,snowfall,weather_code,cloud_cover,is_day&temperature_unit=fahrenheit&timezone=America%2FChicago&forecast_days=1';
const REFRESH_MS = 15 * 60 * 1000;
const ZONE = 'America/Chicago';

type Weather = {
  isDay: boolean;
  condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm';
  temperature: number;
  observedAt: string;
};

export function classifyWeather(current: {
  is_day: number;
  weather_code: number;
  cloud_cover: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  temperature_2m: number;
  time: string;
}): Weather | null {
  if (
    !Number.isFinite(current.weather_code) ||
    !Number.isFinite(current.temperature_2m) ||
    !Number.isFinite(current.cloud_cover) ||
    !Number.isFinite(current.precipitation) ||
    (current.is_day !== 0 && current.is_day !== 1) ||
    typeof current.time !== 'string'
  ) return null;
  const code = current.weather_code;
  const condition = code >= 95 ? 'storm'
    : current.snowfall > 0 || [71, 73, 75, 77, 85, 86].includes(code) ? 'snow'
    : current.rain > 0 || current.showers > 0 || (current.precipitation > 0 && code >= 51) ||
      (code >= 51 && code <= 67) || (code >= 80 && code <= 82) ? 'rain'
    : current.cloud_cover >= 65 || [2, 3, 45, 48].includes(code) ? 'cloudy'
    : 'clear';
  return {
    isDay: current.is_day === 1,
    condition,
    temperature: Math.round(current.temperature_2m),
    observedAt: current.time,
  };
}

function localHour(date: Date): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hour: 'numeric', hourCycle: 'h23' }).format(date));
}

export function useDesMoinesSky() {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch(WEATHER_URL, { signal: controller.signal });
        if (!response.ok) throw new Error('weather unavailable');
        const data: unknown = await response.json();
        if (!data || typeof data !== 'object' || !('current' in data)) throw new Error('invalid weather');
        const next = classifyWeather(data.current as Parameters<typeof classifyWeather>[0]);
        if (active) setWeather(next);
      } catch {
        if (active) setWeather(null);
      }
    };
    void refresh();
    const clock = window.setInterval(() => setNow(new Date()), 60_000);
    const interval = window.setInterval(() => void refresh(), REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setNow(new Date());
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(clock);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // A response older than two refresh windows cannot claim current conditions.
  const currentLocal = new Intl.DateTimeFormat('sv-SE', {
    timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(now).replace(' ', 'T');
  const fresh = weather && Math.abs(
    new Date(currentLocal).getTime() - new Date(weather.observedAt).getTime()
  ) <= 30 * 60_000 ? weather : null;
  const hour = localHour(now);
  return {
    isDay: fresh?.isDay ?? (hour >= 7 && hour < 19),
    condition: fresh?.condition ?? 'clear',
    temperature: fresh?.temperature,
    live: Boolean(fresh),
    time: new Intl.DateTimeFormat('en-US', {
      timeZone: ZONE, hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(now),
  };
}
