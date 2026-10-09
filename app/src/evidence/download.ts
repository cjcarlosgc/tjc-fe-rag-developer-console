const MAX_SUBJECT_ID_LENGTH = 128

const KIND_SLUG: Record<string, string> = {
  ANALYSIS_RUN: 'analysis-run',
  EXPERIMENT: 'experiment',
  RETRIEVAL_COMPARISON: 'retrieval-comparison',
}

/** Sanea el id del sujeto: solo `[A-Za-z0-9._-]`, sin `..`, sin separadores de ruta y con longitud acotada. */
export function sanitizeSubjectId(subjectId: string): string {
  const cleaned = subjectId
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .slice(0, MAX_SUBJECT_ID_LENGTH)
  return cleaned.length > 0 ? cleaned : '_'
}

/** `evidence-{kind}-{subjectId}.json`, con `kind` en minúsculas y guiones (analysis-run, experiment, retrieval-comparison). */
export function evidenceFileName(kind: string, subjectId: string): string {
  const slug = KIND_SLUG[kind]
  if (!slug) throw new Error(`Tipo de evidencia desconocido: ${kind}`)
  return `evidence-${slug}-${sanitizeSubjectId(subjectId)}.json`
}

/** Descarga el texto crudo que devuelve Core con Blob y ancla temporal. Sin URLs firmadas; no registra el contenido. */
export function downloadEvidenceJson(raw: string, fileName: string): void {
  const blob = new Blob([raw], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
