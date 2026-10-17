import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadEvidenceJson, evidenceFileName, sanitizeSubjectId } from './download'

describe('evidenceFileName', () => {
  it('usa evidence-{kind}-{subjectId}.json con kind en minúsculas y guiones', () => {
    expect(evidenceFileName('ANALYSIS_RUN', 'arun_checkout_pr45')).toBe('evidence-analysis-run-arun_checkout_pr45.json')
    expect(evidenceFileName('EXPERIMENT', 'exp_demo_1')).toBe('evidence-experiment-exp_demo_1.json')
    expect(evidenceFileName('RETRIEVAL_COMPARISON', 'rcmp_demo_seed_failed')).toBe('evidence-retrieval-comparison-rcmp_demo_seed_failed.json')
  })

  it('rechaza un kind desconocido', () => {
    expect(() => evidenceFileName('OTHER', 'x')).toThrow()
  })

  it('sanea el subjectId: solo [A-Za-z0-9._-], sin separadores ni ".."', () => {
    expect(sanitizeSubjectId('../../etc/passwd')).not.toMatch(/[/\\]/)
    expect(sanitizeSubjectId('../../etc/passwd')).not.toContain('..')
    expect(sanitizeSubjectId('a b/c\\d?e')).toBe('a_b_c_d_e')
    expect(sanitizeSubjectId('uuid-1.2_3')).toBe('uuid-1.2_3')
  })

  it('acota la longitud y nunca devuelve vacío', () => {
    expect(sanitizeSubjectId('x'.repeat(500))).toHaveLength(128)
    expect(sanitizeSubjectId('')).toBe('_')
    expect(evidenceFileName('EXPERIMENT', '/')).toBe('evidence-experiment-_.json')
  })
})

describe('downloadEvidenceJson', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>
  let clicked: { href: string; download: string } | null

  beforeEach(() => {
    clicked = null
    createObjectURL = vi.fn(() => 'blob:demo-evidence')
    revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked = { href: this.href, download: this.download }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('crea un Blob application/json con el texto crudo, usa ancla temporal y revoca la URL', async () => {
    const raw = '{\n  "schemaVersion": "1"\n}'
    downloadEvidenceJson(raw, 'evidence-experiment-exp_demo_1.json')

    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/json')
    expect(await blob.text()).toBe(raw)
    expect(clicked).toEqual({ href: 'blob:demo-evidence', download: 'evidence-experiment-exp_demo_1.json' })
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:demo-evidence')
    expect(document.querySelectorAll('a')).toHaveLength(0)
  })
})
