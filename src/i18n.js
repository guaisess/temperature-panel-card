/**
 * Textos traducibles (es / en).
 * Versión: 2026.11.5
 */
const TPC_TEXTS = {
  es: {
    entity: 'Entidad de temperatura', humidity: 'Entidad de humedad', battery: 'Entidad de batería',
    name: 'Nombre', hours: 'Horas de gráfica', decimals: 'Decimales', graph_height: 'Alto de la gráfica (px)', info_width: 'Ancho columna datos (px)',
    show_humidity: 'Mostrar humedad', show_battery: 'Mostrar batería', show_minmax: 'Mostrar máx/mín',
    show_graph: 'Mostrar gráfica', show_current_dot: 'Punto del valor actual',
    colors: 'Colores de la gráfica', temp: 'Temp. (°)', color: 'Color',
    state_unavailable: 'No disponible', state_unknown: 'Desconocido', meta_colors: 'Colorear iconos de humedad/batería', humidity_color: 'Color humedad', battery_color: 'Color batería', max: 'Máx', min: 'Mín', no_entity: 'Entidad no disponible',
    entity_required: 'Debes indicar la entidad de temperatura (entity)',
  },
  en: {
    entity: 'Temperature entity', humidity: 'Humidity entity', battery: 'Battery entity',
    name: 'Name', hours: 'Graph hours', decimals: 'Decimals', graph_height: 'Graph height (px)', info_width: 'Data column width (px)',
    show_humidity: 'Show humidity', show_battery: 'Show battery', show_minmax: 'Show max/min',
    show_graph: 'Show graph', show_current_dot: 'Current value dot',
    colors: 'Graph colors', temp: 'Temp (°)', color: 'Color',
    state_unavailable: 'Unavailable', state_unknown: 'Unknown', meta_colors: 'Color humidity/battery icons', humidity_color: 'Humidity color', battery_color: 'Battery color', max: 'Max', min: 'Min', no_entity: 'Entity unavailable',
    entity_required: 'You must set the temperature entity (entity)',
  },
};

/** Devuelve el texto traducido según el idioma de HA (por defecto, español). */
function tpcT(hass, key) {
  const lang = ((hass && hass.language) || 'es').slice(0, 2);
  const dict = TPC_TEXTS[lang] || TPC_TEXTS.es;
  return dict[key] || TPC_TEXTS.es[key] || key;
}
