// Genera las imágenes SVG de la documentación usando el código real de la tarjeta.
// Versión: 2026.11.2
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

// Carga las clases necesarias de src/ (mismo orden que el build)
const fuentes = ['config', 'color-scale', 'stats', 'sparkline-chart']
  .map((f) => readFileSync(new URL(`../src/${f}.js`, import.meta.url), 'utf8'))
  .join('\n');
const { TPC_CONFIG, ColorScale, SparklineChart } = new Function(`${fuentes}; return { TPC_CONFIG, ColorScale, SparklineChart };`)();

// Parámetros de las imágenes
const IMG = { fondo: '#111111', tarjeta: '#1e1e1e', borde: '#333333', texto: '#e5e5e5', suave: '#9ca3af', fuente: 'Roboto, Arial, sans-serif', ancho: 760 };
const scale = new ColorScale(TPC_CONFIG.colorStops);
const opts = { ...TPC_CONFIG.defaults };

/** Serie sintética (tipo día: baja por la noche y sube por la tarde). */
const serie = (base, amp, fase = 0, picos = 0) =>
  Array.from({ length: 240 }, (_, i) => ({
    t: i * 360000,
    v: base + amp * Math.sin(i / 38 + fase) + (picos && i > 150 && i < 165 ? picos : 0),
  }));

/** Dibuja una tarjeta (x,y) con la gráfica real. */
function tarjeta(x, y, w, d, uid) {
  const pts = serie(d.base, d.amp, d.fase, d.pico);
  const cur = pts[pts.length - 1].v;
  const col = scale.colorAt(cur);
  const all = pts.map((p) => p.v);
  const r = new SparklineChart(scale, opts).render(pts, uid);
  const f = (v) => v.toFixed(1).replace('.', ',');
  const gx = x + w * 0.5, gw = w * 0.5 - 20, gy = y + 18, gh = 78;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="114" rx="12" fill="${IMG.tarjeta}" stroke="${IMG.borde}"/>
  <text x="${x + 16}" y="${y + 28}" font-family="${IMG.fuente}" font-size="14" font-weight="500" fill="${IMG.texto}">${d.nombre}</text>
  <text x="${x + 16}" y="${y + 62}" font-family="${IMG.fuente}" font-size="34" font-weight="700" fill="${col}">${f(cur)}<tspan font-size="14" font-weight="400" fill="${IMG.suave}"> °C</tspan></text>
  <text x="${x + 16}" y="${y + 84}" font-family="${IMG.fuente}" font-size="12" fill="${IMG.suave}">💧 ${d.hum} %    🔋 ${d.bat}%</text>
  <text x="${x + 16}" y="${y + 102}" font-family="${IMG.fuente}" font-size="12" fill="${IMG.suave}">↑ ${f(Math.max(...all))}°    ↓ ${f(Math.min(...all))}°</text>
  <svg x="${gx}" y="${gy}" width="${gw}" height="${gh}" viewBox="0 0 300 100" preserveAspectRatio="none">${r.svg.replace(/<svg[^>]*>|<\/svg>/g, '')}</svg>
  <circle cx="${gx + gw}" cy="${gy + (r.lastY / 100) * gh}" r="4.5" fill="${col}"/>`;
}

/** Envuelve el contenido en un SVG con fondo y título. */
function lienzo(h, titulo, contenido) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${IMG.ancho}" height="${h}" viewBox="0 0 ${IMG.ancho} ${h}">
  <rect width="100%" height="100%" rx="16" fill="${IMG.fondo}"/>
  <text x="24" y="36" font-family="${IMG.fuente}" font-size="18" fill="${IMG.texto}">${titulo}</text>${contenido}
</svg>
`;
}

const nota = (x, y, tx, ty, texto) =>
  `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" stroke="#22c55e" stroke-width="1.5"/><circle cx="${tx}" cy="${ty}" r="3" fill="#22c55e"/>
  <text x="${x + 6}" y="${y + 4}" font-family="${IMG.fuente}" font-size="13" fill="#22c55e">${texto}</text>`;

// 1) Anatomía de la tarjeta
const d1 = { nombre: 'Estación Salón', base: 21, amp: 2.5, fase: 0.5, hum: 56, bat: 39, pico: 2 };
const anatomia = lienzo(250, 'Anatomía de la tarjeta',
  tarjeta(24, 60, 480, d1, 'a') +
  nota(522, 80, 130, 88, 'Nombre (editable)') +
  nota(522, 112, 110, 122, 'Temperatura en negrita') +
  nota(522, 144, 150, 144, 'Humedad y batería') +
  nota(522, 176, 120, 162, 'Máx / mín del periodo') +
  nota(522, 208, 420, 130, 'Gráfica con degradado de color') +
  nota(522, 232, 502, 118, 'Valor actual'));

// 2) Escala de colores
const stops = TPC_CONFIG.colorStops;
const gx = 40, gw = IMG.ancho - 80, tmin = stops[0].temp - 4, tmax = stops[stops.length - 1].temp + 4;
const px = (t) => gx + ((t - tmin) / (tmax - tmin)) * gw;
const grad = stops.map((s) => `<stop offset="${((s.temp - tmin) / (tmax - tmin)).toFixed(3)}" stop-color="${s.color}"/>`).join('');
const colores = lienzo(190, 'Colores por temperatura (parametrizables con color_stops)',
  `<defs><linearGradient id="esc">${grad}</linearGradient></defs>
  <rect x="${gx}" y="64" width="${gw}" height="34" rx="8" fill="url(#esc)"/>` +
  stops.map((s) => `<line x1="${px(s.temp)}" y1="98" x2="${px(s.temp)}" y2="112" stroke="${IMG.suave}"/>
  <text x="${px(s.temp)}" y="130" text-anchor="middle" font-family="${IMG.fuente}" font-size="14" fill="${IMG.texto}">${s.temp} °C</text>
  <text x="${px(s.temp)}" y="150" text-anchor="middle" font-family="${IMG.fuente}" font-size="12" fill="${IMG.suave}">${s.color}</text>`).join(''));

// 3) Varias tarjetas apiladas
const pila = lienzo(330, 'Varias tarjetas en vertical (vertical-stack)',
  tarjeta(24, 56, 420, { nombre: 'Estación Meteorológica', base: 21, amp: 2.5, fase: 0.5, hum: 56, bat: 90, pico: 3 }, 'b') +
  tarjeta(24, 180, 420, { nombre: 'Termómetro Salón', base: 19, amp: 3.5, fase: 1.4, hum: 62, bat: 18, pico: 0 }, 'c') +
  `<text x="470" y="120" font-family="${IMG.fuente}" font-size="13" fill="${IMG.suave}">type: vertical-stack</text>
  <text x="470" y="140" font-family="${IMG.fuente}" font-size="13" fill="${IMG.suave}">cards:</text>
  <text x="480" y="160" font-family="${IMG.fuente}" font-size="13" fill="${IMG.suave}">- custom:temperature-panel-card</text>
  <text x="480" y="180" font-family="${IMG.fuente}" font-size="13" fill="${IMG.suave}">- custom:temperature-panel-card</text>`);

mkdirSync(new URL('../docs/images/', import.meta.url), { recursive: true });
for (const [n, s] of [['anatomia', anatomia], ['colores', colores], ['varias-tarjetas', pila]]) {
  writeFileSync(new URL(`../docs/images/${n}.svg`, import.meta.url), s);
}
console.log('Imágenes generadas en docs/images/');
