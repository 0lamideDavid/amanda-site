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
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}
