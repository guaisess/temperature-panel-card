/**
 * Escala de color por temperatura con interpolación lineal entre umbrales.
 * Versión: 2026.11.1
 */
class ColorScale {
  /** @param {Array<{temp:number,color:string}>} stops umbrales (color hex #rrggbb) */
  constructor(stops) {
    this.stops = [...stops].sort((a, b) => a.temp - b.temp);
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
