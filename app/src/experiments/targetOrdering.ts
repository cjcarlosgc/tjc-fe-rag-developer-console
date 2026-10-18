/**
 * WI-CONSOLE-036 B4 · heurística de presentación, NO de dominio.
 * Un constructor no es un target ejecutable de forma fiable como experimento. La raíz del problema es de Core
 * (backlog #4 / IDEA-024): cuando Core marque los símbolos ejecutables, esta heurística debe retirarse.
 * Solo reordena y sugiere: nunca filtra ni bloquea un símbolo que el usuario elija a mano.
 * Por nombre: el último segmento tras `::` o `.` es `constructor` o `__construct`.
 */
export function isConstructorName(name: string): boolean {
  const last = name.split(/::|\./).pop() ?? ''
  return last === 'constructor' || last === '__construct'
}

/** Orden estable: los no-constructores conservan su orden relativo y los constructores van al final. */
export function orderConstructorsLast<T>(items: readonly T[], nameOf: (item: T) => string): T[] {
  return [...items.filter((item) => !isConstructorName(nameOf(item))), ...items.filter((item) => isConstructorName(nameOf(item)))]
}

/** Preselección: primer no-constructor; si todos son constructores, el primero (queda preseleccionado con nota). */
export function defaultTarget<T>(items: readonly T[], nameOf: (item: T) => string): T | undefined {
  return items.find((item) => !isConstructorName(nameOf(item))) ?? items[0]
}
