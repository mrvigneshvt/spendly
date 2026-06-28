export function periodRange(kind: 'month' | 'week', anchor: number): { from: number; to: number } {
  const d = new Date(anchor);
  if (kind === 'month') {
    const from = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime();
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0).getTime() - 1;
    return { from, to };
  }
  // week: Monday-based
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const from = monday.getTime();
  const to = from + 7 * 86400000 - 1;
  return { from, to };
}
