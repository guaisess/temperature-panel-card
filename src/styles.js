/**
 * Estilos CSS de la tarjeta.
 * Versión: 2026.11.1
 */
const TPC_STYLES = `
  ha-card { overflow: hidden; position: relative; }
  .row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }
  .info { display: flex; flex-direction: column; min-width: 0; flex: 0 0 auto; max-width: 55%; }
  .name { font-size: 0.95rem; font-weight: 500; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .temp { font-size: 2.1rem; font-weight: 300; line-height: 1.1; }
  .temp small { font-size: 0.9rem; opacity: .7; margin-left: 2px; }
  .meta { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 0.8rem; color: var(--secondary-text-color); align-items: center; }
  .meta span { display: inline-flex; align-items: center; gap: 2px; }
  .meta ha-icon { --mdc-icon-size: 15px; }
  .low { color: var(--error-color, #ef4444); }
  .chart { position: relative; flex: 1 1 auto; min-width: 0; }
  .chart svg { width: 100%; height: 100%; display: block; }
  .dot { position: absolute; right: -2px; width: 8px; height: 8px; border-radius: 50%; transform: translateY(-50%); box-shadow: 0 0 0 2px var(--card-background-color, #1c1c1c); }
  .msg { padding: 16px; color: var(--secondary-text-color); }
`;
