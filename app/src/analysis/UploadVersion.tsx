import { ChangeEvent, DragEvent, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ApiError } from '../api/client'
import { uploadProjectVersion } from './api'
import { analysisErrorMessage } from './errors'
import type { UploadAccepted } from '../projects/types'

interface Props {
  projectId: string
  onAccepted: (operation: UploadAccepted) => void
}

function validate(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.zip')) return 'Selecciona un archivo con extensión .zip.'
  if (file.size === 0) return 'El archivo ZIP está vacío.'
  return null
}

export function UploadVersion({ projectId, onAccepted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: (selected: File) => uploadProjectVersion(projectId, selected),
    onSuccess: (operation) => onAccepted(operation),
  })

  function selectFile(selected?: File) {
    if (!selected) return
    const error = validate(selected)
    setValidationError(error)
    setFile(error ? null : selected)
    mutation.reset()
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    selectFile(event.dataTransfer.files[0])
  }

  function change(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0])
  }

  return (
    <div className="upload-stack">
      <div className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={drop}>
        <input ref={inputRef} className="visually-hidden" id="zip-file" aria-label="Archivo ZIP" type="file" accept=".zip,application/zip" onChange={change} />
        <div className="zip-cube" aria-hidden="true"><span>ZIP</span></div>
        <div><strong>Suelta aquí una versión del proyecto</strong><p>ZIP de un proyecto TypeScript · el límite lo valida RAG Core</p></div>
        <button className="button secondary" type="button" onClick={() => inputRef.current?.click()}>Seleccionar ZIP</button>
      </div>
      {file && <div className="selected-file"><div><span className="file-dot" /><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(2)} MB</small></div><button className="button primary" disabled={mutation.isPending} onClick={() => mutation.mutate(file)}>{mutation.isPending ? 'Enviando…' : 'Analizar versión'}</button></div>}
      {(validationError || mutation.isError) && <div className="structured-error" role="alert"><strong>No se puede cargar el ZIP</strong><p>{validationError ?? analysisErrorMessage(mutation.error)}</p>{mutation.error instanceof ApiError && mutation.error.correlationId && <code>Correlation ID: {mutation.error.correlationId}</code>}</div>}
    </div>
  )
}
