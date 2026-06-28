export function buildCategorySlices(
  rows: { categoryId: string | null; amount: number }[],
  categories: { id: string; name: string }[],
) {
  const total = rows.reduce((s, r) => s + r.amount, 0) || 1;
  const byCat = new Map<string, number>();
  for (const r of rows) byCat.set(r.categoryId ?? 'uncat', (byCat.get(r.categoryId ?? 'uncat') ?? 0) + r.amount);
  const catMap = new Map<string, string>(categories.map(c => [c.id, c.name]));
  return [...byCat.entries()]
    .map(([categoryId, t]) => ({
      categoryId,
      name: catMap.get(categoryId) ?? 'Uncategorized',
      total: t,
      pct: (t / total) * 100,
    }))
    .sort((a, b) => b.total - a.total);
}
