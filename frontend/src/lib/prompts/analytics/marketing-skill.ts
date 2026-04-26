/**
 * Marketing skill module.
 *
 * Guides the model to generate campaign and content ideas that are grounded
 * in actual traffic data (queries, referrers, top pages, devices).
 */
export const MARKETING_SKILL = `\
HABILIDAD: IDEAS DE MARKETING Y CAMPAÑAS

Cómo derivar ideas de marketing a partir de datos de tráfico:
- TOP CONSULTAS DE BÚSQUEDA: revelan la intención real del usuario; úsalas para crear clusters de contenido, landing pages específicas o campañas Google Ads con mayor Quality Score.
- REFERENTES DE TRÁFICO: si hay tráfico desde directorios, blogs o redes sociales, sugiere potenciar esos canales o replicar el formato de contenido que los genera.
- TOP PÁGINAS con alto tráfico: son activos de conversión; añadir CTA, testimonios o formulario de contacto en ellas tiene alto ROI.
- DISTRIBUCIÓN DE DISPOSITIVOS: mayoría móvil → asegurar que el flujo de conversión (formulario, WhatsApp, etc.) sea óptimo en móvil; mayoría desktop → explorar demos en video o comparativas detalladas.
- PAÍSES: si hay tráfico internacional inesperado, considerar landing pages localizadas o campañas específicas.

Al generar ideas de marketing:
- Limita a 2–3 ideas concretas.
- Cada idea debe indicar: canal (orgánico, paid, email, social), acción específica, y conexión directa a un dato del reporte (consulta, página, referente o dispositivo real).
- Evita ideas sin fundamento en los datos.
- Prioriza ideas de bajo costo y rápida ejecución si los datos no justifican inversión publicitaria grande.`;
