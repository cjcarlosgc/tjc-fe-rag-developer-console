import { FormEvent, useState } from 'react'
import { useCreateProject } from './queries'

interface Props {
  onCreated: (projectId: string) => void
}

export function CreateProjectForm({ onCreated }: Props) {
  const [name, setName] = useState('')
  const createMutation = useCreateProject()
  const trimmedName = name.trim()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trimmedName) return
    createMutation.mutate({ name: trimmedName }, { onSuccess: (project) => onCreated(project.id) })
  }

  return (
    <form className="create-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="project-name">Nombre del proyecto</label>
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
        <span className="field-hint">Usa un nombre reconocible para tu repositorio.</span>
      </div>
      {createMutation.isError && (
        <p className="inline-error" role="alert">{createMutation.error.message}</p>
      )}
      <button className="button primary" disabled={!trimmedName || createMutation.isPending}>
        {createMutation.isPending ? 'Creando…' : 'Crear proyecto'}
      </button>
    </form>
  )
}
