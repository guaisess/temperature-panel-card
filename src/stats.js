/**
 * Utilidades estadísticas y de reducción de series.
 * Versión: 2026.11.1
 */
class Stats {
  /** Devuelve {min,max} de una serie, o null si está vacía. */
  static minMax(points) {
    if (!points.length) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const p of points) {
      if (p.v < min) min = p.v;
      if (p.v > max) max = p.v;
    }
    return { min, max };
  }

  /** Reduce la serie a `n` puntos promediando por tramos de tiempo. */
  static downsample(points, n) {
    if (points.length <= n) return points;
    const t0 = points[0].t;
    const span = points[points.length - 1].t - t0 || 1;
    const buckets = Array.from({ length: n }, () => ({ s: 0, c: 0, t: 0 }));
    for (const p of points) {
      const i = Math.min(n - 1, Math.floor(((p.t - t0) / span) * n));
      buckets[i].s += p.v;
      buckets[i].t += p.t;
      buckets[i].c++;
    }
    return buckets.filter((b) => b.c).map((b) => ({ t: b.t / b.c, v: b.s / b.c }));
  }
}
