# Esquema de estado — Harness V2

`harness/state.json` es un checkpoint operativo y no una segunda fuente de requisitos. `storyIds` y `sprint` siempre se conservan; un corte de harness usa `workItemType: "HARNESS"` y puede tener `storyIds: []`.

```json
{
  "schemaVersion": 3,
  "allowedStatuses": ["SELECTED", "SPEC_VERIFIED", "AWAITING_APPROVAL", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DECISION_REQUIRED", "DONE"],
  "activeWorkItem": {
    "id": "work-item-id",
    "workItemType": "PRODUCT | HARNESS",
    "storyIds": ["HUxx"],
    "sprint": "Sprint N",
    "status": "SELECTED",
    "specPaths": ["spec/features/..."],
    "transversalPaths": [],
    "approved": false,
    "decisionGate": {"checked": false, "blockingDecisionIds": [], "nonBlockingDecisionIds": [], "checkedAt": null},
    "execution": {"leaderAgent": "leader", "analysisAgent": null, "implementationAgent": null, "uxReviewAgent": null, "contractReviewAgent": null, "reviewAgent": null, "handoffs": [], "reviewCycles": 0, "maxReviewCycles": 2},
    "gates": {"sddVerified": "NOT_RUN", "implementationCompleted": "NOT_RUN", "uxReviewed": "NOT_APPLICABLE", "contractReviewed": "NOT_APPLICABLE", "canonicalContractSynced": "NOT_APPLICABLE", "contractSyncPublished": "NOT_APPLICABLE", "independentReviewPassed": "NOT_RUN", "technicalChecksPassed": "NOT_RUN", "interopSyncChecked": "NOT_RUN", "noMocksPresentedAsLive": "NOT_RUN", "noBlockingDecisions": "NOT_RUN", "retryLimitRespected": "NOT_RUN"},
    "coordination": {"uiImpact": false, "contractImpact": false, "pullCheckpoints": [], "publishedSyncIds": [], "pendingRelevantSyncIds": [], "knownIncompatibilities": []},
    "evidence": [],
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601",
    "blockedReason": null
  }
}
```

Reglas verificadas por `validate-harness.mjs`:

- Después de `SELECTED`, `decisionGate` está comprobado, tiene fecha y cero decisiones bloqueantes. Si una decisión bloquea, el estado es `BLOCKED` o `DECISION_REQUIRED` con pregunta concreta en `blockedReason`.
- `PRODUCT` en `IN_PROGRESS`, `IN_REVIEW` o `DONE` requiere `approved=true`. Un corte `HARNESS` documenta su límite no funcional en `evidence`.
- `execution.leaderAgent` siempre es `leader`; `reviewCycles <= maxReviewCycles <= 2`. Los handoffs conservan el formato estándar y el implementer no se registra como `reviewAgent`.
- Los impactos condicionales activan sus roles/gates: `uiImpact` exige `ux-reviewer`/`uxReviewed`; `contractImpact` exige `contract-reviewer` y los tres gates contractuales. Sin impacto, esos gates son `NOT_APPLICABLE`.
- `DONE` exige los gates obligatorios en `PASSED`, PULL en los cuatro checkpoints, cero syncs relevantes pendientes e incompatibilidades conocidas, y evidencia reproducible de los checks técnicos.
- Las rutas especificadas existen y los IDs de decisión pertenecen a las specs referenciadas; el estado nunca duplica su contenido.
