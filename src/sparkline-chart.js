/**
 * Genera el SVG de la gráfica con degradado vertical según la temperatura.
 * Versión: 2026.11.1
 */
class SparklineChart {
  /**
   * @param {ColorScale} scale escala de color
   * @param {object} opts opciones de configuración de la tarjeta
   */
  constructor(scale, opts) {
    this.scale = scale;
    this.opts = opts;
  }

  /**
   * Construye el SVG. Devuelve {svg, lastY} (lastY en % para el punto actual).
   * @param {Array<{t:number,v:number}>} points serie
   * @param {string} uid identificador único para los defs del SVG
   */
  render(points, uid) {
    const C = TPC_CONFIG.chart;
    const W = C.viewWidth;
    const H = C.viewHeight;
    const pad = C.paddingY;
    const pts = Stats.downsample(points, C.maxPoints);
    let { min, max } = Stats.minMax(pts);
    if (max - min < C.minSpan) {
      const m = (max + min) / 2;
      min = m - C.minSpan / 2;
      max = m + C.minSpan / 2;
    }
    const t0 = pts[0].t;
    const span = pts[pts.length - 1].t - t0 || 1;
    const x = (t) => ((t - t0) / span) * W;
    const y = (v) => pad + (1 - (v - min) / (max - min)) * (H - 2 * pad);

    // Curva suave: tangentes horizontales en el punto medio (sin sobreoscilación)
    let d = `M${x(pts[0].t).toFixed(1)},${y(pts[0].v).toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const x0 = x(pts[i - 1].t);
      const y0 = y(pts[i - 1].v);
      const x1 = x(pts[i].t);
      const y1 = y(pts[i].v);
      const mx = ((x0 + x1) / 2).toFixed(1);
      d += ` C${mx},${y0.toFixed(1)} ${mx},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    }
    const area = `${d} L${W},${H} L0,${H} Z`;

    // Degradado vertical: cada altura se colorea según su temperatura
    const stops = [];
    const addStop = (temp) => {
      const off = Math.min(1, Math.max(0, y(temp) / H));
      stops.push({ off, color: this.scale.colorAt(temp) });
    };
    addStop(max);
    this.scale.stops.forEach((s) => { if (s.temp > min && s.temp < max) addStop(s.temp); });
    addStop(min);
    stops.sort((a, b) => a.off - b.off);
    const stopsSvg = stops.map((s) => `<stop offset="${s.off.toFixed(3)}" stop-color="${s.color}"/>`).join('');

    const svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="g${uid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${H}">${stopsSvg}</linearGradient></defs>
      <path d="${area}" fill="url(#g${uid})" opacity="${this.opts.area_opacity}"/>
      <path d="${d}" fill="none" stroke="url(#g${uid})" stroke-width="${this.opts.line_width}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    </svg>`;
    return { svg, lastY: (y(pts[pts.length - 1].v) / H) * 100 };
  }
}
