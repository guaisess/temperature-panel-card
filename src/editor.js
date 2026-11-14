/**
 * Editor visual de la tarjeta (basado en ha-form).
 * Versión: 2026.11.3
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
