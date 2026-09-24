import { describe, expect, it } from 'vitest';
import { classifyWeather } from './useDesMoinesSky';

const current = {
  is_day: 1, weather_code: 3, cloud_cover: 80, precipitation: 0,
  rain: 0, showers: 0, snowfall: 0, temperature_2m: 67.6,
  time: '2026-09-24T13:30',
};

describe('Des Moines scene classification', () => {
  it('uses current rain, snow, storm and daylight signals', () => {
    expect(classifyWeather(current)?.condition).toBe('cloudy');
    expect(classifyWeather({ ...current, rain: 0.3 })?.condition).toBe('rain');
    expect(classifyWeather({ ...current, snowfall: 0.2, rain: 0.3 })?.condition).toBe('snow');
    expect(classifyWeather({ ...current, weather_code: 95, is_day: 0 })?.isDay).toBe(false);
    expect(classifyWeather({ ...current, weather_code: 95 })?.condition).toBe('storm');
  });

  it('rejects a malformed response rather than claiming live weather', () => {
    expect(classifyWeather({ ...current, is_day: 4 })).toBeNull();
    expect(classifyWeather({ ...current, temperature_2m: Number.NaN })).toBeNull();
  });
});
