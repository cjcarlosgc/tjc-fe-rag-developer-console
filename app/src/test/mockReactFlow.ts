/**
 * Shim documentado por React Flow para jsdom (no implementa ResizeObserver/DOMMatrixReadOnly ni mide
 * dimensiones reales): https://reactflow.dev/learn/advanced-use/testing
 */
class ResizeObserver {
  callback: globalThis.ResizeObserverCallback

  constructor(callback: globalThis.ResizeObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    // Síncrono (no setTimeout): con múltiples nodos, cada uno programa su propio timer y una
    // interacción de test puede correr entre medio de que se resuelvan, dejando ese nodo con
    // `pointer-events: none` (aún "sin medir" para React Flow) justo cuando el test lo clickea.
    this.callback([{ target, contentRect: target.getBoundingClientRect() } as globalThis.ResizeObserverEntry], this)
  }

  unobserve() {}
  disconnect() {}
}

class DOMMatrixReadOnly {
  m22: number
  constructor(transform: string) {
    const scale = transform?.match(/scale\(([1-9.])\)/)?.[1]
    this.m22 = scale !== undefined ? +scale : 1
  }
}

let init = false

export function mockReactFlow(): void {
  if (init) return
  init = true

  globalThis.ResizeObserver = ResizeObserver

  // @ts-expect-error shim mínimo, no implementa la API completa de DOMMatrixReadOnly
  globalThis.DOMMatrixReadOnly = DOMMatrixReadOnly

  Object.defineProperties(globalThis.HTMLElement.prototype, {
    offsetHeight: { get() { return parseFloat(this.style.height) || 1 }, configurable: true },
    offsetWidth: { get() { return parseFloat(this.style.width) || 1 }, configurable: true },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis.SVGElement as any).prototype.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 })
}
