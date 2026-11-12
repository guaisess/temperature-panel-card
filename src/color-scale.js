/**
 * Escala de color por temperatura con interpolación lineal entre umbrales.
 * Versión: 2026.11.2
 */
class ColorScale {
  /** @param {Array<{temp:number,color:string}>} stops umbrales (color hex #rrggbb) */
  constructor(stops) {
    this.stops = stops
      .map((s) => ({ temp: Number(s.temp), color: ColorScale.toHex(s.color) }))
      .sort((a, b) => a.temp - b.temp);
  }

  /** Normaliza un color (hex #rrggbb/#rgb o array [r,g,b]) a #rrggbb. */
  static toHex(c) {
    if (Array.isArray(c)) return '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    let h = String(c).trim();
    if (/^#[0-9a-f]{3}$/i.test(h)) h = '#' + [...h.slice(1)].map((x) => x + x).join('');
    return h;
  }

  /** Convierte #rrggbb a [r,g,b]. */
  static _rgb(hex) {
    const h = hex.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
  }

  /** Devuelve el color para una temperatura (interpolado entre umbrales). */
  colorAt(t) {
    const s = this.stops;
    if (t <= s[0].temp) return s[0].color;
    if (t >= s[s.length - 1].temp) return s[s.length - 1].color;
    for (let i = 0; i < s.length - 1; i++) {
      if (t >= s[i].temp && t <= s[i + 1].temp) {
        const f = (t - s[i].temp) / (s[i + 1].temp - s[i].temp);
        const a = ColorScale._rgb(s[i].color);
        const b = ColorScale._rgb(s[i + 1].color);
        const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
        return `rgb(${c[0]},${c[1]},${c[2]})`;
      }
    }
    return s[0].color;
  }
}
