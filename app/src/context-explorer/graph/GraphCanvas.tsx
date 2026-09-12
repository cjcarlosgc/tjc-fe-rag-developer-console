import { useRef, useState } from 'react'
import type { PointerEvent, ReactNode, WheelEvent } from 'react'
import type { GraphNodeLayout } from './graphLayout'
import { useGraphKeyboardNav } from './useGraphKeyboardNav'

export interface GraphEdge { from: string; to: string }

interface Props {
  nodes: GraphNodeLayout[]
  edges: GraphEdge[]
  width: number
  height: number
  selectedId: string | null
  onSelect: (id: string) => void
  ariaLabel: string
  renderNode: (node: GraphNodeLayout, state: { selected: boolean }) => ReactNode
  nodeWidth?: number
  nodeHeight?: number
}

const MIN_SCALE = 0.5
const MAX_SCALE = 2
const DEFAULT_NODE_WIDTH = 240
const DEFAULT_NODE_HEIGHT = 88

/** Canvas SVG hand-rolled: pan/zoom, minimap discreto y roving-tabindex compartidos entre RAG (HU27) y agente (HU28). */
export function GraphCanvas({ nodes, edges, width, height, selectedId, onSelect, ariaLabel, renderNode, nodeWidth = DEFAULT_NODE_WIDTH, nodeHeight = DEFAULT_NODE_HEIGHT }: Props) {
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 })
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null)
  const { focusedId, registerNode, handleKeyDown, setFocusedId } = useGraphKeyboardNav(nodes, onSelect)

  const zoomBy = (factor: number) => setView((current) => ({ ...current, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor)) }))
  const reset = () => setView({ scale: 1, tx: 0, ty: 0 })

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: event.clientX, startY: event.clientY, tx: view.tx, ty: view.ty }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const drag = dragRef.current
    setView((current) => ({ ...current, tx: drag.tx + (event.clientX - drag.startX), ty: drag.ty + (event.clientY - drag.startY) }))
  }
  const onPointerUp = () => { dragRef.current = null }
  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    zoomBy(event.deltaY < 0 ? 1.1 : 0.9)
  }

  return <div className="graph-canvas">
    <div className="graph-toolbar" role="toolbar" aria-label="Controles del grafo">
      <button type="button" className="button secondary" onClick={() => zoomBy(1.2)}>Acercar</button>
      <button type="button" className="button secondary" onClick={() => zoomBy(0.8)}>Alejar</button>
      <button type="button" className="button secondary" onClick={reset}>Reencuadrar</button>
    </div>
    <div className="graph-viewport" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onWheel={onWheel}>
      <svg role="group" aria-label={ariaLabel} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`, transformOrigin: '0 0' }}>
        <g className="graph-edges" aria-hidden="true">
          {edges.map((edge) => {
            const from = nodes.find((node) => node.id === edge.from)
            const to = nodes.find((node) => node.id === edge.to)
            if (!from || !to) return null
            const x1 = from.x + nodeWidth
            const y1 = from.y + nodeHeight / 2
            const x2 = to.x
            const y2 = to.y + nodeHeight / 2
            const midX = (x1 + x2) / 2
            return <path key={`${edge.from}-${edge.to}`} className="graph-edge" d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`} />
          })}
        </g>
        <g className="graph-nodes">
          {nodes.map((node) => {
            const selected = node.id === selectedId
            const isRovingTarget = focusedId ? node.id === focusedId : node === nodes[0]
            return <foreignObject key={node.id} x={node.x} y={node.y} width={nodeWidth} height={nodeHeight} style={{ overflow: 'visible' }}>
              <button
                type="button"
                ref={(element) => registerNode(node.id, element)}
                className={`graph-node${selected ? ' selected' : ''}`}
                tabIndex={isRovingTarget ? 0 : -1}
                aria-pressed={selected}
                onFocus={() => setFocusedId(node.id)}
                onClick={() => onSelect(node.id)}
                onKeyDown={(event) => handleKeyDown(event, node.id)}
              >
                {renderNode(node, { selected })}
              </button>
            </foreignObject>
          })}
        </g>
      </svg>
    </div>
    <svg className="graph-minimap" role="img" aria-label="Minimapa del grafo" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {nodes.map((node) => <rect key={node.id} x={node.x} y={node.y} width={nodeWidth} height={nodeHeight} className={node.id === selectedId ? 'minimap-node selected' : 'minimap-node'} />)}
    </svg>
  </div>
}
