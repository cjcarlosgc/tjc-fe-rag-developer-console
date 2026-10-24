/** Las animaciones de canvas se desactivan en pruebas y con `prefers-reduced-motion: reduce`. */
export function canAnimateCanvas(): boolean {
  if (import.meta.env.MODE === 'test') return false
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
