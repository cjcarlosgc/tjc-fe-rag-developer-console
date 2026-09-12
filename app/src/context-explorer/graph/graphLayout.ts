/** HU27: layout determinista en columnas (raíz → candidatos), sin simulación de física. */
export interface GraphNodeLayout {
  id: string
  column: number
  row: number
  x: number
  y: number
}

export interface GraphLayoutResult {
  nodes: GraphNodeLayout[]
  width: number
  height: number
}

const COLUMN_WIDTH = 280
const ROW_HEIGHT = 104
const PADDING = 40
const MAX_ROWS_PER_COLUMN = 6

/**
 * Coloca la raíz centrada en la columna 0 y reparte los candidatos (hermanos planos, sin jerarquía
 * propia) en columnas de hasta `MAX_ROWS_PER_COLUMN` filas cada una, en el orden recibido (p. ej.
 * `rank`), para que no queden apilados en una sola columna interminable.
 */
export function computeGraphLayout(rootId: string, candidateIds: string[]): GraphLayoutResult {
  const candidateColumnCount = Math.max(1, Math.ceil(candidateIds.length / MAX_ROWS_PER_COLUMN))
  // La primera columna siempre queda completa (o es la única), así que su altura es la máxima entre columnas.
  const rowCount = candidateIds.length === 0 ? 1 : Math.min(candidateIds.length, MAX_ROWS_PER_COLUMN)
  const rootRow = (rowCount - 1) / 2
  const root: GraphNodeLayout = { id: rootId, column: 0, row: rootRow, x: PADDING, y: PADDING + rootRow * ROW_HEIGHT }
  const candidates: GraphNodeLayout[] = candidateIds.map((id, index) => {
    const column = 1 + Math.floor(index / MAX_ROWS_PER_COLUMN)
    const row = index % MAX_ROWS_PER_COLUMN
    return { id, column, row, x: PADDING + column * COLUMN_WIDTH, y: PADDING + row * ROW_HEIGHT }
  })
  const width = PADDING * 2 + COLUMN_WIDTH * candidateColumnCount + 220
  const height = PADDING * 2 + (rowCount - 1) * ROW_HEIGHT + 80
  return { nodes: [root, ...candidates], width, height }
}

/** HU28: trayectoria cronológica del agente — un paso por columna, en el orden recibido. */
export function computeSequentialLayout(ids: string[]): GraphLayoutResult {
  const nodes: GraphNodeLayout[] = ids.map((id, index) => ({ id, column: index, row: 0, x: PADDING + index * COLUMN_WIDTH, y: PADDING }))
  const width = PADDING * 2 + Math.max(0, ids.length - 1) * COLUMN_WIDTH + 220
  const height = PADDING * 2 + 90
  return { nodes, width, height }
}
