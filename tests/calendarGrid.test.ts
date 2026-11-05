import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMonthGrid, buildWeekDays } from "../src/utils/calendarGrid";

test("buildMonthGrid places an item on its correct day and flags out-of-month days", () => {
  const monthDate = new Date(2027, 5, 1); // June 2027
  const item = { id: "a", when: new Date(2027, 5, 15, 10, 0) };
  const weeks = buildMonthGrid(monthDate, [item], (i) => i.when);

  let found = false;
  let juneDaysCount = 0;
  weeks.forEach((week) =>
    week.forEach((day) => {
      if (day.isCurrentMonth) juneDaysCount++;
      if (day.items.includes(item)) {
        found = true;
        assert.equal(day.date.getDate(), 15);
        assert.equal(day.isCurrentMonth, true);
      }
    }),
  );
  assert.equal(found, true);
  assert.equal(juneDaysCount, 30); // June always has 30 days
  assert.equal(weeks.length, 6);
  weeks.forEach((w) => assert.equal(w.length, 7));
});

test("buildWeekDays buckets items into the correct day of a 7-day week", () => {
  const weekStart = new Date(2027, 5, 14);
  const item = { id: "b", when: new Date(2027, 5, 16, 9, 30) };
  const days = buildWeekDays(weekStart, [item], (i) => i.when);
  assert.equal(days.length, 7);
  assert.equal(days[2].date.getDate(), 16);
  assert.deepEqual(days[2].items, [item]);
  assert.equal(days[0].items.length, 0);
});
