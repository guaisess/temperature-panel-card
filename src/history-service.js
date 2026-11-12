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
