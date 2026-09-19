import { useCallback, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { GraphNodeLayout } from './graphLayout'

function closestByRow(candidates: GraphNodeLayout[], row: number): GraphNodeLayout | undefined {
  if (!candidates.length) return undefined
  return candidates.reduce((closest, node) => (Math.abs(node.row - row) < Math.abs(closest.row - row) ? node : closest))
}

/** Roving tabindex: un solo nodo del grafo es alcanzable con Tab; las flechas mueven el foco dentro de la grilla columna/fila. */
export function useGraphKeyboardNav(nodes: GraphNodeLayout[], onActivate: (id: string) => void) {
  const [focusedId, setFocusedId] = useState<string | null>(nodes[0]?.id ?? null)
  const elementsRef = useRef(new Map<string, HTMLElement>())

  const registerNode = useCallback((id: string, element: HTMLElement | null) => {
    if (element) elementsRef.current.set(id, element)
    else elementsRef.current.delete(id)
  }, [])

  const focus = useCallback((id: string) => {
    setFocusedId(id)
    elementsRef.current.get(id)?.focus()
  }, [])

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLElement>, id: string) => {
    const current = nodes.find((node) => node.id === id)
    if (!current) return
    const sameColumn = nodes.filter((node) => node.column === current.column).sort((a, b) => a.row - b.row)
    const columnAt = (column: number) => nodes.filter((node) => node.column === column).sort((a, b) => a.row - b.row)
    const indexInColumn = sameColumn.findIndex((node) => node.id === id)

    let target: GraphNodeLayout | undefined
    switch (event.key) {
      case 'ArrowDown':
        target = sameColumn[indexInColumn + 1]
        break
      case 'ArrowUp':
        target = sameColumn[indexInColumn - 1]
        break
      case 'ArrowRight':
        target = closestByRow(columnAt(current.column + 1), current.row)
        break
      case 'ArrowLeft':
        target = closestByRow(columnAt(current.column - 1), current.row)
        break
      case 'Home':
        target = sameColumn[0]
        break
      case 'End':
        target = sameColumn[sameColumn.length - 1]
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onActivate(id)
        return
      default:
        return
    }
    if (target) {
      event.preventDefault()
      focus(target.id)
    }
  }, [nodes, focus, onActivate])

  return { focusedId, registerNode, handleKeyDown, setFocusedId }
}
