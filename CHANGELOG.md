# Changelog

Formato de versión: `AAAA.MM.V`.

## 2026.11.6 — 2026-11-14
- El relleno bajo la línea usa el degradado de color de la línea, más visible y con desvanecido hacia abajo (`area_opacity` 0.5 por defecto, `area_fade`).
- Imágenes de la documentación regeneradas con el diseño actual.

## 2026.11.5 — 2026-11-14
- Iconos de humedad y batería coloreados (`meta_colors`, `humidity_color`, `battery_color`), configurables en YAML y en el editor visual. La batería baja sigue en rojo.

## 2026.11.4 — 2026-11-14
- Estados `unknown`/`unavailable`: texto traducido ("No disponible"/"Desconocido") pequeño y atenuado, sin unidad ni solapes; gráfica atenuada y sin punto actual.

## 2026.11.3 — 2026-11-14
- Nuevo diseño: el nombre ocupa todo el ancho y la gráfica va debajo, hasta el borde inferior (respetando el padding).
- La gráfica empieza siempre en la misma posición, independientemente de la longitud del nombre (`info_width`).

## 2026.11.2 — 2026-11-12
- Temperatura en negrita; humedad y batería en una línea y máx/mín en otra.
- Colores parametrizables también desde el editor visual; `color_stops` admite hex o RGB.
- Imágenes ilustrativas en la documentación (`docs/images`).
- Eliminada la referencia a otros proyectos del README.

## 2026.11.1 — 2026-11-12
- Primera versión: diseño horizontal, gráfica con degradado por temperatura, humedad, batería, máx/mín del periodo, editor visual y YAML.
