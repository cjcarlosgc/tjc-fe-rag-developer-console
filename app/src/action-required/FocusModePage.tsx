import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { isMockDataSource } from '../api/dataSource'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { RepoChip } from '../ui/RepoChip'
import { useContextQuestionSet, useSubmitFunctionalAnswer } from './queries'
import type { ConflictResolution, FunctionalAnswerChoice, FunctionalKnowledgeConflictResponse, VisualAidResponse } from './types'

/** Evita open-redirect: `returnTo` solo puede ser una ruta interna. */
function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/action-required'
  return value
}

const CHOICE_LABELS: Record<Exclude<FunctionalAnswerChoice, 'FREE_TEXT'>, string> = {
  YES: 'Sí',
  NO: 'No',
  DEPENDS: 'Depende',
  UNKNOWN: 'No lo sé',
}

function VisualAid({ aid }: { aid: VisualAidResponse }) {
  return <div className="visual-aid">
    <div className="visual-aid-heading"><span className="visual-aid-kind">{aid.kind.replace(/_/g, ' ')}</span><strong>{aid.title}</strong></div>
    <pre className="visual-aid-content">{aid.content}</pre>
  </div>
}

export function FocusModePage() {
  const { analysisRunId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const returnTo = safeReturnTo(searchParams.get('returnTo'))
  const mock = isMockDataSource()
  const questionSetQuery = useContextQuestionSet(analysisRunId)
  const submitAnswer = useSubmitFunctionalAnswer(analysisRunId)
  const [answerText, setAnswerText] = useState('')
  const [pendingAnswer, setPendingAnswer] = useState<{ questionId: string; choice: FunctionalAnswerChoice; answer: string | null } | null>(null)

  if (questionSetQuery.isPending) return <LoadingState label="Abriendo Focus Mode…" />
  if (questionSetQuery.isError) return <ErrorState message={questionSetQuery.error.message} onRetry={() => void questionSetQuery.refetch()} />

  const { currentQuestion, functionalBehaviorValidated } = questionSetQuery.data
  const conflict = submitAnswer.error instanceof ApiError && submitAnswer.error.code === 'FUNCTIONAL_KNOWLEDGE_CONFLICT'
    ? submitAnswer.error.details as FunctionalKnowledgeConflictResponse
    : null

  function submit(choice: FunctionalAnswerChoice) {
    if (!currentQuestion) return
    const answer = answerText.trim() ? answerText.trim() : null
    setPendingAnswer({ questionId: currentQuestion.id, choice, answer })
    submitAnswer.mutate(
      { questionId: currentQuestion.id, input: { choice, answer } },
      { onSuccess: () => { setAnswerText(''); setPendingAnswer(null) } },
    )
  }

  /** HU51 (INTEROP-2.1 §6.11, definido/no implementado): reenvía la misma respuesta con la decisión del conflicto. */
  function resolveConflict(action: ConflictResolution['action']) {
    if (!pendingAnswer || !conflict) return
    submitAnswer.mutate(
      { questionId: pendingAnswer.questionId, input: { choice: pendingAnswer.choice, answer: pendingAnswer.answer, conflictResolution: { conflictId: conflict.conflictId, action } } },
      { onSuccess: () => { setAnswerText(''); setPendingAnswer(null) } },
    )
  }

  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: 'Action Required', to: '/action-required' }, { label: 'Focus Mode' }]} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">Focus Mode</p>
        <h1>Contexto funcional</h1>
        <p>Una pregunta a la vez. Tu respuesta nunca se aplica automáticamente al código.</p>
      </div>
      {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
    </div>

    {!currentQuestion && (
      <div className="panel success-note contract-note">
        <div>
          <strong>{functionalBehaviorValidated ? 'Contexto funcional confirmado' : 'Sin preguntas pendientes en este Run'}</strong>
          <p>{functionalBehaviorValidated
            ? 'Todas las preguntas de este Run fueron respondidas. No se promete publicación ni merge automático.'
            : 'Este Run no tiene una pregunta vigente — puede que el HEAD haya cambiado y ya no se reanude.'}</p>
        </div>
      </div>
    )}

    {currentQuestion && <div className="panel focus-mode-card">
      <span className="run-heading-meta"><RepoChip repositoryName={currentQuestion.repositoryName} /><span className="pr-ref">PR #{currentQuestion.pullRequestNumber} · {currentQuestion.target.qualifiedName}</span></span>
      <h2>{currentQuestion.question}</h2>
      <p className="focus-mode-rationale">{currentQuestion.rationale}</p>
      {currentQuestion.visualAid && <VisualAid aid={currentQuestion.visualAid} />}

      <div className="answer-choices" role="group" aria-label="Respuesta">
        {(Object.keys(CHOICE_LABELS) as Exclude<FunctionalAnswerChoice, 'FREE_TEXT'>[]).map((choice) => (
          <button key={choice} type="button" className={`button ${choice === 'UNKNOWN' ? 'secondary' : 'primary'}`} disabled={submitAnswer.isPending} onClick={() => submit(choice)}>
            {CHOICE_LABELS[choice]}
          </button>
        ))}
      </div>

      <div className="field free-text-field">
        <label htmlFor="focus-mode-answer-text">Aclaración (opcional)</label>
        <textarea id="focus-mode-answer-text" value={answerText} onChange={(event) => setAnswerText(event.target.value)} rows={3} />
      </div>
      <button type="button" className="button secondary" disabled={submitAnswer.isPending || !answerText.trim()} onClick={() => submit('FREE_TEXT')}>
        Responder solo con este texto
      </button>

      {conflict && (
        <div className="panel focus-mode-conflict" role="alert">
          <strong>Esta respuesta contradice una regla vigente</strong>
          <p>Ya existe una regla activa para <code>{conflict.conflictingKnowledge.targetRef}</code>. Decide antes de continuar — no se persiste nada todavía.</p>
          <dl className="metadata">
            <div><dt>Regla vigente</dt><dd>{conflict.conflictingKnowledge.normalizedRule}</dd></div>
            <div><dt>Regla propuesta</dt><dd>{conflict.proposedNormalizedRule}</dd></div>
          </dl>
          <div className="answer-choices" role="group" aria-label="Resolución del conflicto">
            <button type="button" className="button primary" disabled={submitAnswer.isPending} onClick={() => resolveConflict('SUPERSEDE')}>Reemplazar regla vigente</button>
            <button type="button" className="button secondary" disabled={submitAnswer.isPending} onClick={() => resolveConflict('KEEP_EXISTING')}>Mantener la vigente, guardar como evidencia</button>
          </div>
        </div>
      )}

      {submitAnswer.isError && !conflict && <p className="inline-error" role="alert">{submitAnswer.error.message}</p>}
    </div>}

    <div className="run-actions"><Link className="button secondary button-link" to={returnTo}>Volver</Link></div>
  </section>
}
