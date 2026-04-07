/** Default 15-minute slots Mon–Fri window: 09:00–17:45 (inquiry UI). */
export const TIME_SLOTS = Array.from({ length: 37 }, (_, i) => {
  const totalMinutes = i * 15;
  const hour = Math.floor(totalMinutes / 60) + 9;
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

export const SLOT_COUNT = TIME_SLOTS.length;
