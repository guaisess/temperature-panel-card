/**
 * Tarjeta principal: lee configuración y estados, pide histórico y pinta el resultado.
 * Versión: 2026.11.2
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
      meta.push(`<span><ha-icon icon="mdi:water-percent"></ha-icon>${this._fmt(hum.state, 0)} ${hum.attributes.unit_of_measurement || '%'}</span>`);
    }
    const bat = c.battery && h.states[c.battery];
    if (c.show_battery && bat && !isNaN(parseFloat(bat.state))) {
      const low = parseFloat(bat.state) <= c.battery_low;
      meta.push(`<span class="${low ? 'low' : ''}"><ha-icon icon="mdi:${low ? 'battery-alert' : 'battery'}"></ha-icon>${this._fmt(bat.state, 0)}%</span>`);
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
    const color = isNaN(cur) ? 'var(--primary-text-color)' : this._scale.colorAt(cur);
    const meta = this._metaBase();
    const range = [];

    let chart = '';
    const pts = this._points;
    if (c.show_graph) {
      chart = `<div class="chart" style="height:${c.graph_height}px"></div>`;
      if (pts && pts.length > 1) {
        const all = isNaN(cur) ? pts : [...pts, { t: Date.now(), v: cur }];
        const mm = Stats.minMax(all);
        if (c.show_minmax) {
          range.push(`<span title="${tpcT(h, 'max')}"><ha-icon icon="mdi:arrow-up"></ha-icon>${this._fmt(mm.max, c.decimals)}°</span>`);
          range.push(`<span title="${tpcT(h, 'min')}"><ha-icon icon="mdi:arrow-down"></ha-icon>${this._fmt(mm.min, c.decimals)}°</span>`);
        }
        const r = new SparklineChart(this._scale, c).render(all, this._uid);
        const dot = c.show_current_dot ? `<div class="dot" style="top:${r.lastY}%;background:${color}"></div>` : '';
        chart = `<div class="chart" style="height:${c.graph_height}px">${r.svg}${dot}</div>`;
      }
    }

    this.shadowRoot.innerHTML = `<style>${TPC_STYLES}</style>
      <ha-card><div class="row">
        <div class="info">
          <div class="name">${name}</div>
          <div class="temp" style="color:${color}">${isNaN(cur) ? st.state : this._fmt(cur, c.decimals)}<small>${unit}</small></div>
          ${meta.length ? `<div class="meta">${meta.join('')}</div>` : ''}
          ${range.length ? `<div class="meta">${range.join('')}</div>` : ''}
        </div>${chart}
      </div></ha-card>`;
  }
}
