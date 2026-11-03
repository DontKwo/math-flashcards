// Calculate local day index to handle timezone offsets
function getDayIndex(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
}

export function calculateStreak(sessionDates: Date[], now: Date = new Date()): { currentStreak: number; longestStreak: number } {
  if (sessionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const days: number[] = Array.from(new Set(sessionDates.map(getDayIndex))).sort((a, b) => a - b);
  const currentDay: number = getDayIndex(now);

  let longestStreak: number = 0;
  let tempStreak: number = 0;
  let prevDay: number | null = null;

  for (const day of days) {
    if (prevDay === null || day === prevDay + 1) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    prevDay = day;
  }

  let currentStreak: number = 0;
  const setDays: Set<number> = new Set(days);
  if (setDays.has(currentDay) || setDays.has(currentDay - 1)) {
    let checkDay: number = setDays.has(currentDay) ? currentDay : currentDay - 1;
    while (setDays.has(checkDay)) {
      currentStreak++;
      checkDay--;
    }
  }

  return { currentStreak, longestStreak };
}
