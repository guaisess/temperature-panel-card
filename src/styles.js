/**
 * Estilos CSS de la tarjeta.
 * Versión: 2026.11.4
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
