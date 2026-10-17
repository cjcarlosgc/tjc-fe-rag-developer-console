import { FormEvent, useState } from 'react'
import { useCreateProject } from './queries'
import type { Workspace } from './types'
import { bindingErrorMessage, errorCorrelationId } from '../control-plane/errors'
import { ErrorNote } from '../ui/Feedback'

interface Props {
  workspace: Workspace
  onCreated: (projectId: string) => void
}

export function CreateProjectForm({ workspace, onCreated }: Props) {
  const [name, setName] = useState('')
  const createMutation = useCreateProject()
  const trimmedName = name.trim()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trimmedName) return
    createMutation.mutate({ name: trimmedName, workspaceId: workspace.id }, { onSuccess: (project) => onCreated(project.id) })
  }

  return (
    <form className="create-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="project-name">Nombre del proyecto</label>
        <div className="field-row">
          <input
            id="project-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="p. ej. checkout-service"
            autoComplete="off"
            maxLength={200}
            required
          />
          <button className="button primary" disabled={!trimmedName || createMutation.isPending}>
            {createMutation.isPending ? 'Creando…' : 'Crear proyecto'}
          </button>
        </div>
        <span className="field-hint">Usa un nombre reconocible para tu repositorio.</span>
        <span className="field-hint">Workspace: {workspace.kind === 'PERSONAL' ? `cuenta personal · ${workspace.login ?? 'tu cuenta'}` : workspace.login}</span>
      </div>
      {createMutation.isError && (
        <ErrorNote message={bindingErrorMessage(createMutation.error)} correlationId={errorCorrelationId(createMutation.error)} />
      )}
    </form>
  )
}
