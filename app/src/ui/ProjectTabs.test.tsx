import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import { ProjectTabs } from './ProjectTabs'

test('resalta el tab activo según la ruta actual', () => {
  render(
    <MemoryRouter initialEntries={['/projects/prj_x/functional-knowledge']}>
      <ProjectTabs projectId="prj_x" />
    </MemoryRouter>,
  )
  const nav = screen.getByRole('navigation', { name: 'Secciones del proyecto' })
  expect(within(nav).getByRole('link', { name: 'Functional Knowledge' })).toHaveAttribute('aria-current', 'page')
  expect(within(nav).getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current')
})

test('el tab "Runs" queda activo cuando la URL trae ?projectId= de este proyecto', () => {
  render(
    <MemoryRouter initialEntries={['/analysis-runs?projectId=prj_x']}>
      <ProjectTabs projectId="prj_x" />
    </MemoryRouter>,
  )
  const nav = screen.getByRole('navigation', { name: 'Secciones del proyecto' })
  expect(within(nav).getByRole('link', { name: 'Runs' })).toHaveAttribute('aria-current', 'page')
})
