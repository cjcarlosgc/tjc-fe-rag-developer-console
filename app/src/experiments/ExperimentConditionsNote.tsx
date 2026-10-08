export const EXPERIMENT_CONDITIONS_NOTE = 'Comparación bajo condiciones experimentales externas controladas. RAG usa recuperación SE + ContextBuilder + conocimiento funcional aplicable; el agente generalista explora en solo lectura sin conocimiento persistente.'

export function ExperimentConditionsNote() {
  return (
    <div className="contract-note experiment-conditions-note" role="note">
      <p>{EXPERIMENT_CONDITIONS_NOTE}</p>
    </div>
  )
}
