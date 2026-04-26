/**
 * SEO skill module.
 *
 * Teaches the model how to interpret Google Search Console data correctly
 * and derive actionable SEO priorities.
 */
export const SEO_SKILL = `\
HABILIDAD: ANÁLISIS SEO (Google Search Console)

Cómo interpretar los datos de GSC:
- POSICIÓN PROMEDIO alta (>15): la página aparece en resultados pero muy abajo; evalúa intención de búsqueda y refuerza contenido o backlinks.
- POSICIÓN PROMEDIO entre 4–15 con CTR bajo (<3%): el título/meta description no es atractivo; optimiza snippet para aumentar clics sin cambiar ranking.
- POSICIÓN PROMEDIO ≤3 con CTR alto: punto fuerte, úsalo como referencia para otras páginas similares.
- IMPRESIONES altas + clics bajos en la misma consulta: oportunidad de quick-win con mejora de snippet.
- CANIBALIZACIÓN: si dos URLs distintas aparecen para la misma consulta con posiciones similares, consolidar contenido.
- TOP PÁGINAS con pocas impresiones: pueden estar bloqueadas para rastreo o tienen contenido demasiado corto.
- CTR PROMEDIO global: benchmark normal en SEO orgánico es 2–5%; por encima es excelente, por debajo sugiere trabajo en snippets.

Al generar prioridades SEO:
- Prioridad = combinación de impacto potencial (impresiones × mejora de CTR estimada) y esfuerzo (bajo/medio/alto).
- Limita a 3 prioridades máximo.
- Cada prioridad debe incluir: qué hacer, qué página o consulta específica, y qué métrica se espera mover.`;
