import { strToU8, zipSync } from 'fflate'
import type { ArtifactViewModel } from './types'

export function artifactContent(artifact: ArtifactViewModel): string {
  return artifact.lines
    .filter((line) => line.type !== 'REMOVED')
    .map((line) => line.content)
    .join('\n')
}

export function buildArtifactArchive(artifacts: ArtifactViewModel[]): Blob {
  const files = Object.fromEntries(artifacts.map((artifact) => [artifact.relativePath, strToU8(artifactContent(artifact))]))
  const bytes = zipSync(files, { level: 6 })
  return new Blob([new Uint8Array(bytes)], { type: 'application/zip' })
}
