/**
 * Configuración central de la tarjeta (sin valores hardcodeados en el resto del código).
 * Versión: 2026.11.3
 */
const TPC_CONFIG = {
  // Versión de la tarjeta (formato AAAA.MM.V)
  version: '2026.11.3',
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
    area_opacity: 0.18,
    battery_low: 20,
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
    minSpan: 2,      // rango mínimo (grados) para no aplanar la línea
  },
};
