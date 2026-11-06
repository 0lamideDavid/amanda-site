export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

// Monday-first week, matching UK convention (the business is in Plymouth).
export function startOfWeek(d: Date) {
  const result = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const leadingDays = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - leadingDays);
  return result;
}

export function endOfWeek(d: Date) {
  const start = startOfWeek(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return end;
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function endOfDay(d: Date) {
  const start = startOfDay(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return end;
}

export function parseDateParam(value: unknown): Date {
  if (typeof value === "string") {
    // A bare "YYYY-MM-DD" (what formatLocalDate produces, and what the
    // calendar's ?date= links carry) is otherwise parsed as UTC midnight
    // per the JS spec, not local midnight — symmetric with formatLocalDate
    // here so the round-trip lands on the same calendar day regardless of
    // which way the server's UTC offset points.
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
      const [, y, m, d] = dateOnly;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// `date.toISOString().slice(...)` is a real bug on a server whose local
// timezone isn't UTC (this one runs at UTC+1): it converts to UTC first,
// silently shifting the displayed date/time by the offset — e.g.
// `new Date(2026, 11, 1).toISOString().slice(0, 10)` gives "2026-11-30",
// not "2026-12-01". These format using local getters instead, so what's
// displayed (and what calendar prev/next links carry) always matches the
// server's own notion of "today".
export function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatLocalTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatLocalDateTime(d: Date): string {
  return `${formatLocalDate(d)} ${formatLocalTime(d)}`;
}
