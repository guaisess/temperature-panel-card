(() => {
/**
 * Configuración central de la tarjeta (sin valores hardcodeados en el resto del código).
 * Versión: 2026.11.6
 */
const TPC_CONFIG = {
  // Versión de la tarjeta (formato AAAA.MM.V)
  version: '2026.11.4',
  // Nombre de los elementos personalizados
  cardTag: 'temperature-panel-card',
  editorTag: 'temperature-panel-card-editor',
  cardName: 'Temperature Panel Card',
  cardDescription: 'Tarjeta horizontal de temperatura con gráfica coloreada, humedad, batería y máx/mín.',

  // Valores por defecto de la configuración del usuario
  defaults: {
    name: '',
    hours: 24,
    decimals: 1,
    graph_height: 70,   // alto mínimo de la zona de gráfica (px)
    info_width: 110,    // ancho fijo de la columna de temperatura/datos (px): alinea todas las gráficas
    refresh_minutes: 10,
    show_humidity: true,
    show_battery: true,
    show_minmax: true,
    show_graph: true,
    show_current_dot: true,
    line_width: 2,
    area_opacity: 0.5,   // opacidad máxima del relleno bajo la línea
    area_fade: true,     // el relleno se desvanece hacia la parte inferior
    battery_low: 20,
    meta_colors: true,           // colorear los iconos de humedad y batería
    humidity_color: '#38bdf8',   // color del icono de humedad
    battery_color: '#22c55e',    // color del icono de batería (en rojo si está baja)
  },

  // Umbrales de color por defecto (°C): la gráfica se colorea con degradado según el valor
  colorStops: [
    { temp: 10, color: '#3b82f6' },
    { temp: 16, color: '#06b6d4' },
    { temp: 20, color: '#22c55e' },
    { temp: 24, color: '#f59e0b' },
    { temp: 28, color: '#ef4444' },
  ],

  // Parámetros técnicos de la gráfica
  chart: {
    viewWidth: 300,  // ancho lógico del SVG
    viewHeight: 100, // alto lógico del SVG
    maxPoints: 120,  // puntos máximos tras reducir el histórico
    paddingY: 6,     // margen vertical en unidades del SVG
    fadeEnd: 0.04,   // opacidad relativa del relleno en el borde inferior (0-1)
    minSpan: 2,      // rango mínimo (grados) para no aplanar la línea
  },
};

/**
 * Textos traducibles (es / en).
 * Versión: 2026.11.6
 */
const TPC_TEXTS = {
  es: {
    entity: 'Entidad de temperatura', humidity: 'Entidad de humedad', battery: 'Entidad de batería',
    name: 'Nombre', hours: 'Horas de gráfica', decimals: 'Decimales', graph_height: 'Alto de la gráfica (px)', info_width: 'Ancho columna datos (px)',
    show_humidity: 'Mostrar humedad', show_battery: 'Mostrar batería', show_minmax: 'Mostrar máx/mín',
    show_graph: 'Mostrar gráfica', show_current_dot: 'Punto del valor actual',
    colors: 'Colores de la gráfica', temp: 'Temp. (°)', color: 'Color',
    state_unavailable: 'No disponible', state_unknown: 'Desconocido', meta_colors: 'Colorear iconos de humedad/batería', humidity_color: 'Color humedad', battery_color: 'Color batería', area_fade: 'Desvanecer relleno de la gráfica', max: 'Máx', min: 'Mín', no_entity: 'Entidad no disponible',
    entity_required: 'Debes indicar la entidad de temperatura (entity)',
  },
  en: {
    entity: 'Temperature entity', humidity: 'Humidity entity', battery: 'Battery entity',
    name: 'Name', hours: 'Graph hours', decimals: 'Decimals', graph_height: 'Graph height (px)', info_width: 'Data column width (px)',
    show_humidity: 'Show humidity', show_battery: 'Show battery', show_minmax: 'Show max/min',
    show_graph: 'Show graph', show_current_dot: 'Current value dot',
    colors: 'Graph colors', temp: 'Temp (°)', color: 'Color',
    state_unavailable: 'Unavailable', state_unknown: 'Unknown', meta_colors: 'Color humidity/battery icons', humidity_color: 'Humidity color', battery_color: 'Battery color', area_fade: 'Fade graph fill', max: 'Max', min: 'Min', no_entity: 'Entity unavailable',
    entity_required: 'You must set the temperature entity (entity)',
  },
};

/** Devuelve el texto traducido según el idioma de HA (por defecto, español). */
function tpcT(hass, key) {
  const lang = ((hass && hass.language) || 'es').slice(0, 2);
  const dict = TPC_TEXTS[lang] || TPC_TEXTS.es;
  return dict[key] || TPC_TEXTS.es[key] || key;
}

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

/**
 * Servicio de histórico: consulta la API WebSocket de HA y cachea los resultados.
 * Versión: 2026.11.1
 */
class HistoryService {
  constructor() {
    this._cache = new Map(); // clave: entidad|horas -> {time, points}
  }

  /**
   * Obtiene puntos [{t:ms, v:número}] de la entidad en las últimas `hours` horas.
   * @param {object} hass objeto hass
   * @param {string} entityId entidad
   * @param {number} hours horas
   * @param {number} refreshMinutes minutos de validez de la caché
   */
  async get(hass, entityId, hours, refreshMinutes) {
    const key = `${entityId}|${hours}`;
    const hit = this._cache.get(key);
    if (hit && Date.now() - hit.time < refreshMinutes * 60000) return hit.points;

    const end = new Date();
    const start = new Date(end.getTime() - hours * 3600000);
    const res = await hass.callWS({
      type: 'history/history_during_period',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      entity_ids: [entityId],
      minimal_response: true,
      no_attributes: true,
      significant_changes_only: false,
    });
    const rows = (res && res[entityId]) || [];
    const points = [];
    for (const r of rows) {
      const v = parseFloat(r.s !== undefined ? r.s : r.state);
      const raw = r.lu !== undefined ? r.lu : (r.lc !== undefined ? r.lc : r.last_updated);
      // lu/lc vienen en segundos (epoch); last_updated en ISO
      const t = typeof raw === 'number' ? raw * 1000 : Date.parse(raw);
      if (!isNaN(v) && !isNaN(t)) points.push({ t, v });
    }
    this._cache.set(key, { time: Date.now(), points });
    return points;
  }
}

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

/**
 * Genera el SVG de la gráfica con degradado vertical según la temperatura.
 * Versión: 2026.11.6
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

    // Máscara vertical: el relleno coloreado se desvanece hacia abajo (mismo degradado de color que la línea)
    const fade = this.opts.area_fade
      ? `<defs><linearGradient id="f${uid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${H}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="${C.fadeEnd}"/></linearGradient><mask id="m${uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#f${uid})"/></mask></defs>`
      : '';
    const svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="g${uid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${H}">${stopsSvg}</linearGradient></defs>
      ${fade}
      <path d="${area}" fill="url(#g${uid})" opacity="${this.opts.area_opacity}"${this.opts.area_fade ? ` mask="url(#m${uid})"` : ''}/>
      <path d="${d}" fill="none" stroke="url(#g${uid})" stroke-width="${this.opts.line_width}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    </svg>`;
    return { svg, lastY: (y(pts[pts.length - 1].v) / H) * 100 };
  }
}

/**
 * Estilos CSS de la tarjeta.
 * Versión: 2026.11.6
 */
const TPC_STYLES = `
  ha-card { overflow: hidden; position: relative; }
  .row { display: grid; grid-template-columns: var(--tpc-info-w, 110px) minmax(0, 1fr); grid-template-rows: auto 1fr; column-gap: 12px; row-gap: 2px; padding: 12px 14px; }
  .row.nograph { grid-template-columns: minmax(0, 1fr); }
  .info { display: flex; flex-direction: column; min-width: 0; grid-column: 1; grid-row: 2; }
  .name { grid-column: 1 / -1; grid-row: 1; font-size: 0.95rem; font-weight: 500; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .temp { font-size: 2.1rem; font-weight: 700; line-height: 1.1; }
  .temp.off { font-size: 1.05rem; font-weight: 500; line-height: 2.31rem; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .chart.off { opacity: .35; }
  .temp small { font-size: 0.9rem; opacity: .7; margin-left: 2px; }
  .meta { display: flex; flex-wrap: nowrap; gap: 10px; font-size: 0.8rem; color: var(--secondary-text-color); align-items: center; min-height: 1.2em; margin-top: 2px; }
  .meta span { display: inline-flex; align-items: center; gap: 2px; }
  .meta ha-icon { --mdc-icon-size: 15px; }
  .low { color: var(--error-color, #ef4444); }
  .chart { position: relative; grid-column: 2; grid-row: 2; min-width: 0; align-self: stretch; }
  .chart svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .dot { position: absolute; right: -2px; width: 8px; height: 8px; border-radius: 50%; transform: translateY(-50%); box-shadow: 0 0 0 2px var(--card-background-color, #1c1c1c); }
  .msg { padding: 16px; color: var(--secondary-text-color); }
`;

/**
 * Tarjeta principal: lee configuración y estados, pide histórico y pinta el resultado.
 * Versión: 2026.11.6
 */
class TemperaturePanelCard extends HTMLElement {
  static getConfigElement() { return document.createElement(TPC_CONFIG.editorTag); }

  static getStubConfig(hass) {
    const e = Object.keys(hass.states).find(
      (k) => k.startsWith('sensor.') && hass.states[k].attributes.device_class === 'temperature'
    );
    return { entity: e || 'sensor.temperatura' };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._history = new HistoryService();
    this._points = null;
    this._loading = false;
    this._lastFetch = 0;
    this._uid = Math.random().toString(36).slice(2, 8);
  }

  /** Valida y combina la configuración con los valores por defecto. */
  setConfig(config) {
    if (!config || !config.entity) throw new Error(tpcT(this._hass, 'entity_required'));
    this._config = { ...TPC_CONFIG.defaults, ...config };
    this._scale = new ColorScale(config.color_stops || TPC_CONFIG.colorStops);
    this._points = null;
    this._lastFetch = 0;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._maybeFetch();
    this._render();
  }

  getCardSize() { return 2; }

  /** Pide el histórico si procede (sin solapar peticiones). */
  async _maybeFetch() {
    const c = this._config;
    if (!c || !c.show_graph || this._loading) return;
    if (this._points && Date.now() - this._lastFetch < c.refresh_minutes * 60000) return;
    this._loading = true;
    try {
      this._points = await this._history.get(this._hass, c.entity, c.hours, c.refresh_minutes);
    } catch (e) {
      this._points = [];
    }
    this._lastFetch = Date.now();
    this._loading = false;
    this._render();
  }

  /** Formatea un número con los decimales y el idioma de HA. */
  _fmt(v, dec) {
    const lang = (this._hass && this._hass.language) || 'es';
    return Number(v).toLocaleString(lang, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  /** Construye los datos secundarios: humedad, batería. */
  _metaBase() {
    const c = this._config;
    const h = this._hass;
    const meta = [];
    const hum = c.humidity && h.states[c.humidity];
    if (c.show_humidity && hum && !isNaN(parseFloat(hum.state))) {
      const st = c.meta_colors ? ` style="color:${c.humidity_color}"` : '';
      meta.push(`<span><ha-icon icon="mdi:water-percent"${st}></ha-icon>${this._fmt(hum.state, 0)} ${hum.attributes.unit_of_measurement || '%'}</span>`);
    }
    const bat = c.battery && h.states[c.battery];
    if (c.show_battery && bat && !isNaN(parseFloat(bat.state))) {
      const low = parseFloat(bat.state) <= c.battery_low;
      const st = c.meta_colors && !low ? ` style="color:${c.battery_color}"` : '';
      meta.push(`<span class="${low ? 'low' : ''}"><ha-icon icon="mdi:${low ? 'battery-alert' : 'battery'}"${st}></ha-icon>${this._fmt(bat.state, 0)}%</span>`);
    }
    return meta;
  }

  _render() {
    const c = this._config;
    const h = this._hass;
    if (!c || !h) return;
    const st = h.states[c.entity];
    if (!st) {
      this.shadowRoot.innerHTML = `<style>${TPC_STYLES}</style><ha-card><div class="msg">${tpcT(h, 'no_entity')}: ${c.entity}</div></ha-card>`;
      return;
    }
    const cur = parseFloat(st.state);
    const unit = st.attributes.unit_of_measurement || '°C';
    const name = c.name || st.attributes.friendly_name || c.entity;
    const off = isNaN(cur);
    const stateTxt = st.state === 'unavailable' ? tpcT(h, 'state_unavailable') : st.state === 'unknown' ? tpcT(h, 'state_unknown') : st.state;
    const color = isNaN(cur) ? 'var(--primary-text-color)' : this._scale.colorAt(cur);
    const meta = this._metaBase();
    const range = [];

    let chart = '';
    const pts = this._points;
    if (c.show_graph) {
      chart = `<div class="chart" style="min-height:${c.graph_height}px"></div>`;
      if (pts && pts.length > 1) {
        const all = isNaN(cur) ? pts : [...pts, { t: Date.now(), v: cur }];
        const mm = Stats.minMax(all);
        if (c.show_minmax) {
          range.push(`<span title="${tpcT(h, 'max')}"><ha-icon icon="mdi:arrow-up"></ha-icon>${this._fmt(mm.max, c.decimals)}°</span>`);
          range.push(`<span title="${tpcT(h, 'min')}"><ha-icon icon="mdi:arrow-down"></ha-icon>${this._fmt(mm.min, c.decimals)}°</span>`);
        }
        const r = new SparklineChart(this._scale, c).render(all, this._uid);
        const dot = c.show_current_dot && !off ? `<div class="dot" style="top:${r.lastY}%;background:${color}"></div>` : '';
        chart = `<div class="chart${off ? ' off' : ''}" style="min-height:${c.graph_height}px">${r.svg}${dot}</div>`;
      }
    }

    this.shadowRoot.innerHTML = `<style>${TPC_STYLES}</style>
      <ha-card><div class="row${c.show_graph ? '' : ' nograph'}" style="--tpc-info-w:${c.info_width}px">
        <div class="name">${name}</div>
        <div class="info">
          ${off
            ? `<div class="temp off" title="${stateTxt}">${stateTxt}</div>`
            : `<div class="temp" style="color:${color}">${this._fmt(cur, c.decimals)}<small>${unit}</small></div>`}
          ${meta.length ? `<div class="meta">${meta.join('')}</div>` : ''}
          ${range.length ? `<div class="meta">${range.join('')}</div>` : ''}
        </div>${chart}
      </div></ha-card>`;
  }
}

/**
 * Editor visual de la tarjeta (basado en ha-form).
 * Versión: 2026.11.6
 */
class TemperaturePanelCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this._draw(); }
  set hass(hass) { this._hass = hass; this._draw(); }

  /** Esquema del formulario (los colores van en una sección desplegable). */
  _schema() {
    const stops = TPC_CONFIG.colorStops;
    const colorFields = [];
    stops.forEach((_, i) => {
      colorFields.push({ name: `temp_${i}`, selector: { number: { mode: 'box', step: 0.5 } } });
      colorFields.push({ name: `color_${i}`, selector: { color_rgb: {} } });
    });
    colorFields.push({ name: 'humidity_color', selector: { color_rgb: {} } });
    colorFields.push({ name: 'battery_color', selector: { color_rgb: {} } });
    return [
      { name: 'entity', required: true, selector: { entity: { domain: 'sensor', device_class: 'temperature' } } },
      { name: 'name', selector: { text: {} } },
      { name: 'humidity', selector: { entity: { domain: 'sensor', device_class: 'humidity' } } },
      { name: 'battery', selector: { entity: { domain: 'sensor', device_class: 'battery' } } },
      {
        type: 'grid', name: '', schema: [
          { name: 'hours', selector: { number: { min: 1, max: 720, mode: 'box' } } },
          { name: 'decimals', selector: { number: { min: 0, max: 3, mode: 'box' } } },
          { name: 'info_width', selector: { number: { min: 60, max: 300, mode: 'box' } } },
          { name: 'graph_height', selector: { number: { min: 20, max: 300, mode: 'box' } } },
        ],
      },
      {
        type: 'grid', name: '', schema: [
          { name: 'show_graph', selector: { boolean: {} } },
          { name: 'show_minmax', selector: { boolean: {} } },
          { name: 'show_humidity', selector: { boolean: {} } },
          { name: 'show_battery', selector: { boolean: {} } },
          { name: 'show_current_dot', selector: { boolean: {} } },
          { name: 'area_fade', selector: { boolean: {} } },
          { name: 'meta_colors', selector: { boolean: {} } },
        ],
      },
      { type: 'expandable', name: '', title: tpcT(this._hass, 'colors'), schema: [{ type: 'grid', name: '', schema: colorFields }] },
    ];
  }

  /** Convierte la configuración (color_stops) a campos planos del formulario. */
  _toForm(config) {
    const data = { ...TPC_CONFIG.defaults, ...config };
    const stops = config.color_stops || TPC_CONFIG.colorStops;
    TPC_CONFIG.colorStops.forEach((_, i) => {
      const s = stops[i] || TPC_CONFIG.colorStops[i];
      data[`temp_${i}`] = s.temp;
      const hex = ColorScale.toHex(s.color);
      data[`color_${i}`] = ColorScale._rgb(hex);
    });
    data.humidity_color = ColorScale._rgb(ColorScale.toHex(data.humidity_color));
    data.battery_color = ColorScale._rgb(ColorScale.toHex(data.battery_color));
    delete data.color_stops;
    return data;
  }

  /** Convierte los campos planos del formulario de nuevo a color_stops. */
  _fromForm(value) {
    const out = { ...value };
    const stops = [];
    TPC_CONFIG.colorStops.forEach((_, i) => {
      if (out[`temp_${i}`] !== undefined && out[`color_${i}`]) {
        stops.push({ temp: Number(out[`temp_${i}`]), color: ColorScale.toHex(out[`color_${i}`]) });
      }
      delete out[`temp_${i}`];
      delete out[`color_${i}`];
    });
    out.color_stops = stops;
    ['humidity_color', 'battery_color'].forEach((k) => { if (out[k]) out[k] = ColorScale.toHex(out[k]); });
    return out;
  }

  _draw() {
    if (!this._config || !this._hass) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = (s) => {
        const m = /^(temp|color)_(\d+)$/.exec(s.name);
        return m ? `${tpcT(this._hass, m[1])} ${Number(m[2]) + 1}` : tpcT(this._hass, s.name);
      };
      this._form.addEventListener('value-changed', (ev) => {
        this.dispatchEvent(new CustomEvent('config-changed', {
          detail: { config: this._fromForm(ev.detail.value) }, bubbles: true, composed: true,
        }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = this._schema();
    this._form.data = this._toForm(this._config);
  }
}

/**
 * Registro de los elementos personalizados y de la tarjeta en el selector de HA.
 * Versión: 2026.11.6
 */
customElements.define(TPC_CONFIG.cardTag, TemperaturePanelCard);
customElements.define(TPC_CONFIG.editorTag, TemperaturePanelCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: TPC_CONFIG.cardTag,
  name: TPC_CONFIG.cardName,
  description: TPC_CONFIG.cardDescription,
  preview: true,
});
console.info(`%c TEMPERATURE-PANEL-CARD %c ${TPC_CONFIG.version} `, 'background:#22c55e;color:#000', 'background:#333;color:#fff');

})();
