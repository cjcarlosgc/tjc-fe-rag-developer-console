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

/** Coloca la raíz centrada en la columna 0 y cada candidato en su propia fila de la columna 1, en el orden recibido (p. ej. `rank`). */
export function computeGraphLayout(rootId: string, candidateIds: string[]): GraphLayoutResult {
  const rowCount = Math.max(candidateIds.length, 1)
  const rootRow = (rowCount - 1) / 2
  const root: GraphNodeLayout = { id: rootId, column: 0, row: rootRow, x: PADDING, y: PADDING + rootRow * ROW_HEIGHT }
  const candidates: GraphNodeLayout[] = candidateIds.map((id, index) => ({
    id,
    column: 1,
    row: index,
    x: PADDING + COLUMN_WIDTH,
    y: PADDING + index * ROW_HEIGHT,
  }))
  const width = PADDING * 2 + COLUMN_WIDTH + 220
  const height = PADDING * 2 + Math.max(0, rowCount - 1) * ROW_HEIGHT + 80
  return { nodes: [root, ...candidates], width, height }
}
