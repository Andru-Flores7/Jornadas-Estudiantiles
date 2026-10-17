// ============================================================
// CONSTANTS — Valores fijos del sistema de puntuación
// ============================================================
// Modifica aquí si los puntos o la cantidad de ítems cambian
// en futuras ediciones de las Jornadas Estudiantiles.

/** IDs de los jurados registrados en la base de datos */
export const JUROR_IDS = ['juror1', 'juror2', 'juror3', 'juror4'];

/** Puntos que otorga ganar cada juego */
export const POINTS_PER_GAME = 6;

/** Puntos que otorga la Napolitana */
export const POINTS_NAPOLITANA = 4;

/** Puntos que otorga el Popurrí Alternativo */
export const POINTS_POPURRI = 4;

/** Puntos que otorga el Popurrí Mascota */
export const POINTS_MASCOTA = 3;

/** Puntos que otorga cada Ritmo (hay 3) */
export const POINTS_RITMO = 4;

/** Puntos que otorga el Videoclip */
export const POINTS_VIDEOCLIP = 15;

/** Cantidad de ítems votables en el Popurrí Alternativo */
export const POPURRI_ITEMS = 11;

/** Cantidad de ítems votables en el Popurrí Mascota */
export const MASCOTA_ITEMS = 5;

/** Cantidad de juegos por encuentro */
export const JUEGOS_COUNT = 3;

/** Criterios de evaluación para Ritmos (escala 1-5 pts cada uno) */
export const RITMO_CRITERIA = [
  { key: 'vestimenta',         label: 'Vestimenta' },
  { key: 'originalidad',       label: 'Originalidad' },
  { key: 'desplazamiento',     label: 'Desplazamiento' },
  { key: 'coordinacion',       label: 'Coordinación' },
  { key: 'conexion en pareja', label: 'Conexión en pareja' },
  { key: 'escenografia',       label: 'Escenografía' },
];

/** Criterios de evaluación para Videoclip (escala 1-8 pts cada uno) */
export const VIDEOCLIP_CRITERIA = [
  { key: 'cordinacion coreografica',     label: 'Coordinación coreográfica' },
  { key: 'composicion coreografica',     label: 'Composición coreográfica' },
  { key: 'adaptacion al tiempo musical', label: 'Adaptación al tiempo musical' },
  { key: 'uso del espacio',              label: 'Uso del espacio' },
  { key: 'impacto visual',               label: 'Impacto visual' },
  { key: 'carisma',                      label: 'Carisma' },
  { key: 'escenografia',                 label: 'Escenografía' },
];
