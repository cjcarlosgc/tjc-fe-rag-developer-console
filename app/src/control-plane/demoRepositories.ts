/**
 * Demo-only: en la GitHub App real, la selección de repositorio ocurre en la propia UI de
 * instalación de GitHub, fuera de la Console (no hay endpoint de Core para "listar repos
 * instalables" — el contrato §6.8 solo define instalar/completar/consultar/desvincular un
 * binding ya elegido). Esta lista simula esa pantalla externa dentro del flujo DEMO; la usan
 * tanto `IntegrationsPage` (para pintar el selector) como `mockCompleteGitHubInstallation`
 * (para resolver `repositoryName` a partir del `repositoryId` elegido).
 */
export const DEMO_INSTALLABLE_REPOSITORIES: { repositoryId: string; repositoryName: string }[] = [
  { repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service' },
  { repositoryId: 'repo_billing', repositoryName: 'acme/billing-engine' },
  { repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service' },
]
