/**
 * Carga diferida del backend simulado. Solo se descarga cuando la fuente de datos es `mock`; con `live` el chunk
 * `mockBackend` (~180 KB de datos de demostración) nunca se pide ni forma parte de la carga inicial.
 */
export const loadMockBackend = () => import('./mockBackend')
