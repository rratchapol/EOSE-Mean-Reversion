type PacificParts = {
  weekday: string;
  hour: number;
  minute: number;
};

function pacificParts(date = new Date()): PacificParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
    timeZone: "America/Los_Angeles",
  });
  const parts = formatter.formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    weekday: value("weekday"),
    hour: Number(value("hour")),
    minute: Number(value("minute")),
  };
}

export function isUsMarketHours(date = new Date()): boolean {
  const parts = pacificParts(date);
  const isWeekday = !["Sat", "Sun"].includes(parts.weekday);
  const minutes = parts.hour * 60 + parts.minute;
  const open = 6 * 60 + 30;
  const close = 13 * 60;

  return isWeekday && minutes >= open && minutes <= close;
}

export function isPacificNoon(date = new Date()): boolean {
  const parts = pacificParts(date);
  return parts.hour === 12 && parts.minute < 15;
}
