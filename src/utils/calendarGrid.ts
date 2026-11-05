export interface CalendarDay<T> {
  date: Date;
  items: T[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

function dayBucket<T>(
  dayStart: Date,
  items: T[],
  getDate: (item: T) => Date,
  isCurrentMonth: boolean,
  today: Date,
): CalendarDay<T> {
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return {
    date: dayStart,
    items: items.filter((item) => {
      const itemDate = getDate(item);
      return itemDate >= dayStart && itemDate < dayEnd;
    }),
    isCurrentMonth,
    isToday: dayStart.getTime() === today.getTime(),
  };
}

// Six-week grid starting on the Monday on/before the 1st, so short months
// still render full rows (the usual admin-calendar convention).
export function buildMonthGrid<T>(monthDate: Date, items: T[], getDate: (item: T) => Date): CalendarDay<T>[][] {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - leadingDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weeks: CalendarDay<T>[][] = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: CalendarDay<T>[] = [];
    for (let d = 0; d < 7; d++) {
      const dayStart = new Date(cursor);
      week.push(dayBucket(dayStart, items, getDate, dayStart.getMonth() === monthDate.getMonth(), today));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function buildWeekDays<T>(weekStart: Date, items: T[], getDate: (item: T) => Date): CalendarDay<T>[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: CalendarDay<T>[] = [];
  const cursor = new Date(weekStart);
  for (let d = 0; d < 7; d++) {
    const dayStart = new Date(cursor);
    days.push(dayBucket(dayStart, items, getDate, true, today));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
