/**
 * Calculates duration in minutes between two time strings.
 * Supports "HH:mm" (24-hour) as well as "hh:mm AM/PM" or "08:00".
 */
export function calculateMinutesBetween(fromTimeStr: string, toTimeStr: string): number {
  if (!fromTimeStr || !toTimeStr) return 0;

  const fromMinutes = parseTimeToMinutes(fromTimeStr);
  const toMinutes = parseTimeToMinutes(toTimeStr);

  if (fromMinutes === null || toMinutes === null) return 0;

  if (toMinutes >= fromMinutes) {
    return toMinutes - fromMinutes;
  } else {
    // Overnight roll (e.g. 23:00 to 01:00 = 120 mins)
    return 24 * 60 - fromMinutes + toMinutes;
  }
}

export function parseTimeToMinutes(timeStr: string): number | null {
  const trimmed = timeStr.trim().toUpperCase();
  if (!trimmed) return null;

  // Check 12-hour AM/PM format (e.g. "08:00 PM", "8:30AM", "12:15 PM", "8PM")
  const ampmMatchWithMin = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatchWithMin) {
    let hours = parseInt(ampmMatchWithMin[1], 10);
    const minutes = parseInt(ampmMatchWithMin[2], 10);
    const period = ampmMatchWithMin[3].toUpperCase();

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  const ampmMatchHourOnly = trimmed.match(/^(\d{1,2})\s*(AM|PM)$/i);
  if (ampmMatchHourOnly) {
    let hours = parseInt(ampmMatchHourOnly[1], 10);
    const period = ampmMatchHourOnly[2].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60;
  }

  // Check 24-hour format (e.g. "08:00", "14:30")
  const standardMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (standardMatch) {
    const hours = parseInt(standardMatch[1], 10);
    const minutes = parseInt(standardMatch[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Automatically calculates shift duration string from an operational time string
 * such as "8:00PM - 6:00AM" or "8:00am - 6:00pm" or "08:00 - 18:00"
 * Returns e.g. "10 Hours" or "10 Hours 30 Mins"
 */
export function calculateShiftDurationFromOperationalTime(operationalTime: string): string {
  if (!operationalTime) return '';
  const parts = operationalTime.split(/[-–—to]/i);
  if (parts.length < 2) return '';

  const startStr = parts[0].trim();
  const endStr = parts[1].trim();

  const diffMinutes = calculateMinutesBetween(startStr, endStr);
  if (diffMinutes <= 0) return '';

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
  }
  return `${hours} Hours ${minutes} Mins`;
}

/**
 * Formats a duration in minutes into industrial display string
 * e.g. 10 -> "10 MIN", 150 -> "02H 30M", 60 -> "01H 00M"
 */
export function formatDurationDisplay(minutes: number): string {
  if (minutes <= 0) return '0 MIN';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${String(hours).padStart(2, '0')}H ${String(mins).padStart(2, '0')}M`;
  } else if (hours > 0 && mins === 0) {
    return `${String(hours).padStart(2, '0')} ${hours === 1 ? 'Hour' : 'Hours'}`;
  } else {
    return `${mins} MIN`;
  }
}

/**
 * Formats total downtime string as seen in the physical report
 * e.g., "03 Hours" or "02H 30M"
 */
export function formatTotalDowntime(totalMinutes: number): string {
  if (totalMinutes === 0) return '00 Hours';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (mins === 0) {
    return `${String(hours).padStart(2, '0')} Hours`;
  }
  return `${String(hours).padStart(2, '0')}H ${String(mins).padStart(2, '0')}M`;
}
