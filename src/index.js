/**
 * Registro de los elementos personalizados y de la tarjeta en el selector de HA.
 * Versión: 2026.11.4
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
