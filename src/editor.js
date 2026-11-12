/**
 * Editor visual de la tarjeta (basado en ha-form).
 * Versión: 2026.11.1
 */
class TemperaturePanelCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this._draw(); }
  set hass(hass) { this._hass = hass; this._draw(); }

  /** Esquema del formulario. */
  _schema() {
    return [
      { name: 'entity', required: true, selector: { entity: { domain: 'sensor', device_class: 'temperature' } } },
      { name: 'name', selector: { text: {} } },
      { name: 'humidity', selector: { entity: { domain: 'sensor', device_class: 'humidity' } } },
      { name: 'battery', selector: { entity: { domain: 'sensor', device_class: 'battery' } } },
      {
        type: 'grid', name: '', schema: [
          { name: 'hours', selector: { number: { min: 1, max: 720, mode: 'box' } } },
          { name: 'decimals', selector: { number: { min: 0, max: 3, mode: 'box' } } },
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
    ];
  }

  _draw() {
    if (!this._config || !this._hass) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = (s) => tpcT(this._hass, s.name);
      this._form.addEventListener('value-changed', (ev) => {
        this.dispatchEvent(new CustomEvent('config-changed', {
          detail: { config: ev.detail.value }, bubbles: true, composed: true,
        }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = this._schema();
    this._form.data = { ...TPC_CONFIG.defaults, ...this._config };
  }
}
