import { strFromU8, unzipSync } from 'fflate'
import { expect, test } from 'vitest'
import type { ArtifactViewModel } from './types'
import { buildArtifactArchive } from './archive'

test('genera un ZIP real con paths y contenido de los artifacts', async () => {
  const artifacts: ArtifactViewModel[] = [{
    id: 'artifact-1',
    runId: 'run-1',
    relativePath: 'src/cart.spec.ts',
    artifactType: 'MODIFIED',
    valid: true,
    lines: [
      { type: 'REMOVED', oldLineNumber: 1, content: 'contenido anterior' },
      { type: 'ADDED', newLineNumber: 1, content: 'contenido generado' },
    ],
  }]

  const archive = buildArtifactArchive(artifacts)
  const entries = unzipSync(new Uint8Array(await archive.arrayBuffer()))

  expect(archive.type).toBe('application/zip')
  expect(Object.keys(entries)).toEqual(['src/cart.spec.ts'])
  expect(strFromU8(entries['src/cart.spec.ts'])).toBe('contenido generado')
})
