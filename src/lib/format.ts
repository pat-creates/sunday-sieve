// Display formatting: Asia/Manila time, written out in full (design system README), and pesos.
// Safe to import from client components.
const TZ = 'Asia/Manila';

/** Centavos (integer) to "₱1,234.00". Same as the design system's formatPeso. */
export function formatPeso(centavos: number): string {
  const n = Math.round(Number(centavos) || 0);
  const neg = n < 0;
  const abs = Math.abs(n);
  const pesos = Math.floor(abs / 100);
  const cents = String(abs % 100).padStart(2, '0');
  return `${neg ? '-' : ''}₱${pesos.toLocaleString('en-PH')}.${cents}`;
}

function parts(d: Date, opts: Intl.DateTimeFormatOptions) {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, ...opts }).formatToParts(d).map((p) => [p.type, p.value]),
  );
}

/** "3:00 PM" */
export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(d);
}

/** "Saturday, 15 August" */
export function formatDay(d: Date): string {
  const p = parts(d, { weekday: 'long', day: 'numeric', month: 'long' });
  return `${p.weekday}, ${p.day} ${p.month}`;
}

/** "Friday, 14 August at 6:00 PM" */
export function formatDateTime(d: Date): string {
  return `${formatDay(d)} at ${formatTime(d)}`;
}

/** "Friday, 14 August, 6:00 PM" (the deadline style used in the order summary and countdown) */
export function formatDeadline(d: Date): string {
  return `${formatDay(d)}, ${formatTime(d)}`;
}

/** "3:00–7:00 PM", or "11:00 AM–2:00 PM" across noon */
export function formatWindow(start: Date, end: Date): string {
  const s = formatTime(start);
  const e = formatTime(end);
  const sameHalf = s.slice(-2) === e.slice(-2);
  return `${sameHalf ? s.slice(0, -3) : s}–${e}`;
}

/** "Sat 5 Dec", for the one-line bake day bar. */
export function formatShortDay(d: Date): string {
  const p = parts(d, { weekday: 'short', day: 'numeric', month: 'short' });
  return `${p.weekday} ${p.day} ${p.month}`;
}

/** "Fri 6 PM" or "Fri 6:30 PM", for the one-line bake day bar. */
export function formatShortDayTime(d: Date): string {
  const weekday = parts(d, { weekday: 'short' }).weekday;
  return `${weekday} ${formatTime(d).replace(':00 ', ' ')}`;
}

/** "Friday" */
export function formatWeekday(d: Date): string {
  return parts(d, { weekday: 'long' }).weekday;
}

/** A bake_date (YYYY-MM-DD, a calendar date) as "Saturday, 15 August". */
export function formatBakeDate(isoDate: string): string {
  return formatDay(new Date(`${isoDate}T12:00:00+08:00`));
}
