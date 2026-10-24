/**
 * WI-CONSOLE-035 (INTEROP-2.7 §6.11): destino de la regla tal como lo trae el contrato.
 * Muestra valores crudos (sin mapas ni heurísticas); un valor nulo o vacío se muestra como «sin dato».
 */

export interface RuleTargetFields {
  qualifiedName?: string | null
  filePath?: string | null
  kind?: string | null
}

const NO_DATA = 'sin dato'

function present(value: string | null | undefined): string | null {
  return value && value.trim() ? value : null
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  const text = present(value)
  return (
    <div>
      <dt>{label}</dt>
      <dd className={text ? undefined : 'rule-target-empty'}>{text ?? NO_DATA}</dd>
    </div>
  )
}

export function RuleTargetSummary({ target, scenarioKind }: { target: RuleTargetFields; scenarioKind: string | null | undefined }) {
  return (
    <dl className="rule-target">
      <Field label="Símbolo" value={target.qualifiedName} />
      <Field label="Archivo" value={target.filePath} />
      <Field label="Tipo" value={target.kind} />
      <Field label="Escenario" value={scenarioKind} />
    </dl>
  )
}

/** Frase fija sobre los botones de respuesta: solo se muestra cuando el usuario puede responder (DEC-FK-002: «No lo sé» es abstención). */
export function RuleRegistrationNote({ qualifiedName }: { qualifiedName: string | null | undefined }) {
  return (
    <p className="rule-target-note">
      Tu respuesta se registrará como regla para <code>{present(qualifiedName) ?? NO_DATA}</code>. «No lo sé» solo registra una abstención.
    </p>
  )
}
