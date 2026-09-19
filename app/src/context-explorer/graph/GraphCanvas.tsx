import { useEffect, useMemo } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { Handle, MiniMap, Position, ReactFlow, ReactFlowProvider, useReactFlow, useViewport } from '@xyflow/react'
import type { Edge, Node, NodeProps, NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { GraphNodeLayout } from './graphLayout'
import { useGraphKeyboardNav } from './useGraphKeyboardNav'

export interface GraphEdge { from: string; to: string }

interface Props {
  nodes: GraphNodeLayout[]
  edges: GraphEdge[]
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

interface FlowNodeData extends Record<string, unknown> {
  content: ReactNode
  isRovingTarget: boolean
  isSelected: boolean
  registerNode: (id: string, element: HTMLElement | null) => void
  onFocusNode: (id: string) => void
  onSelectNode: (id: string) => void
  onKeyDownNode: (event: ReactKeyboardEvent<HTMLElement>, id: string) => void
}

type FlowNode = Node<FlowNodeData, 'graphNode'>

/** Nodo custom de React Flow: reusa el <button> con roving-tabindex ya existente, solo cambia quién lo posiciona. */
function GraphFlowNode({ id, data }: NodeProps<FlowNode>) {
  return <>
    <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
    <button
      type="button"
      ref={(element) => data.registerNode(id, element)}
      className={`graph-node${data.isSelected ? ' selected' : ''}`}
      tabIndex={data.isRovingTarget ? 0 : -1}
      aria-pressed={data.isSelected}
      onFocus={() => data.onFocusNode(id)}
      onClick={() => data.onSelectNode(id)}
      onKeyDown={(event) => data.onKeyDownNode(event, id)}
    >
      {data.content}
    </button>
    <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
  </>
}

const nodeTypes: NodeTypes = { graphNode: GraphFlowNode }

function GraphCanvasInner({ nodes, edges, selectedId, onSelect, ariaLabel, renderNode, nodeWidth = DEFAULT_NODE_WIDTH, nodeHeight = DEFAULT_NODE_HEIGHT }: Props) {
  const { focusedId, registerNode, handleKeyDown, setFocusedId } = useGraphKeyboardNav(nodes, onSelect)
  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow()
  const { zoom } = useViewport()

  // Mantiene visible el nodo con foco de teclado, incluso si el usuario paneó/hizo zoom lejos de él.
  useEffect(() => {
    if (!focusedId) return
    const node = nodes.find((item) => item.id === focusedId)
    if (!node) return
    void setCenter(node.x + nodeWidth / 2, node.y + nodeHeight / 2, { zoom, duration: 200 })
    // Solo debe reencuadrar cuando cambia el nodo con foco, no en cada cambio de zoom/paneo manual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedId])

  const flowNodes: FlowNode[] = useMemo(() => nodes.map((node) => {
    const isSelected = node.id === selectedId
    const isRovingTarget = focusedId ? node.id === focusedId : node === nodes[0]
    const data: FlowNodeData = {
      content: renderNode(node, { selected: isSelected }),
      isRovingTarget,
      isSelected,
      registerNode,
      onFocusNode: setFocusedId,
      onSelectNode: onSelect,
      onKeyDownNode: handleKeyDown,
    }
    return { id: node.id, type: 'graphNode', position: { x: node.x, y: node.y }, width: nodeWidth, height: nodeHeight, data }
  }), [nodes, selectedId, focusedId, renderNode, registerNode, setFocusedId, onSelect, handleKeyDown, nodeWidth, nodeHeight])

  const flowEdges: Edge[] = useMemo(() => edges.map((edge) => ({ id: `${edge.from}-${edge.to}`, source: edge.from, target: edge.to, focusable: false })), [edges])

  return <div className="graph-canvas">
    <div className="graph-toolbar" role="toolbar" aria-label="Controles del grafo">
      <button type="button" className="button secondary" onClick={() => zoomIn({ duration: 150 })}>Acercar</button>
      <button type="button" className="button secondary" onClick={() => zoomOut({ duration: 150 })}>Alejar</button>
      <button type="button" className="button secondary" onClick={() => fitView({ duration: 200 })}>Reencuadrar</button>
    </div>
    <div className="graph-viewport" role="group" aria-label={ariaLabel}>
      <ReactFlow
        colorMode="dark"
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        panOnDrag
        panOnScroll
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        zoomOnPinch
        minZoom={MIN_SCALE}
        maxZoom={MAX_SCALE}
        proOptions={{ hideAttribution: true }}
        fitView
      >
        <MiniMap className="graph-minimap" pannable zoomable nodeColor="var(--muted)" nodeStrokeWidth={0} maskColor="rgba(11,11,13,.85)" />
      </ReactFlow>
    </div>
  </div>
}

/** Canvas de grafo: pan/zoom vía React Flow (maneja pinch/scroll de trackpad correctamente), roving-tabindex propio compartido entre RAG (HU27) y agente (HU28). */
export function GraphCanvas(props: Props) {
  return <ReactFlowProvider><GraphCanvasInner {...props} /></ReactFlowProvider>
}
