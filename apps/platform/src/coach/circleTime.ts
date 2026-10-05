/** Interpret wall-clock input in the Circle's timezone, not the device timezone. */
export function circleTimeToISO(date: string, time: string, timezone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    throw new Error('Enter a date and time.');
  const wall = Date.parse(`${date}T${time}:00Z`);
  let instant = wall;
  for (let i = 0; i < 3; i++) {
    const offset =
      new Intl.DateTimeFormat('en', { timeZone: timezone, timeZoneName: 'longOffset' })
        .formatToParts(new Date(instant))
        .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    const m = offset.match(/GMT([+-])(\d{2}):(\d{2})/);
    const minutes = m ? (Number(m[2]) * 60 + Number(m[3])) * (m[1] === '+' ? 1 : -1) : 0;
    instant = wall - minutes * 60000;
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(instant));
  const value = (key: string) => parts.find((p) => p.type === key)?.value;
  if (
    `${value('year')}-${value('month')}-${value('day')}` !== date ||
    `${value('hour')}:${value('minute')}` !== time
  )
    throw new Error('That local time does not exist. Check the date and time.');
  return new Date(instant).toISOString();
}
