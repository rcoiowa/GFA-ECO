import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { classifyWeather, useDesMoinesSky } from './useDesMoinesSky';

const current = {
  is_day: 1,
  weather_code: 3,
  cloud_cover: 80,
  precipitation: 0,
  rain: 0,
  showers: 0,
  snowfall: 0,
  temperature_2m: 67.6,
  time: Date.parse('2026-09-24T18:30:00Z') / 1000,
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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('weather fallback', () => {
  it('uses the same-origin endpoint and drops weather when a refresh fails', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ current: { ...current, time: Date.now() / 1000 } }),
      })
      .mockRejectedValueOnce(new Error('offline'));
    vi.stubGlobal('fetch', fetcher);
    const { result } = renderHook(() => useDesMoinesSky());
    await waitFor(() => expect(result.current.live).toBe(true));
    expect(fetcher.mock.calls[0]?.[0]).toBe('/api/weather/des-moines');
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitFor(() => expect(result.current.live).toBe(false));
    expect(result.current.temperature).toBeUndefined();
  });

  it('rejects stale observations independently of the visitor timezone', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({ current: { ...current, time: Date.now() / 1000 - 3600 } }),
        }),
    );
    const { result } = renderHook(() => useDesMoinesSky());
    await act(async () => {});
    expect(result.current.live).toBe(false);
    expect(result.current.condition).toBe('clear');
  });
});
