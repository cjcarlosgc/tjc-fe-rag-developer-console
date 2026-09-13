import { screen } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { ActionRequiredPage } from './ActionRequiredPage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

test('HU38: lista los Runs con contexto funcional pendiente y enlaza a Focus Mode con returnTo', async () => {
  renderApp(<ActionRequiredPage />, { initialEntry: '/action-required' })

  expect(await screen.findByText('acme/checkout-service · PR #42')).toBeInTheDocument()
  expect(screen.getByText('acme/billing-engine · PR #17')).toBeInTheDocument()

  const links = await screen.findAllByRole('link')
  const link = links.find((item) => item.textContent?.includes('CouponPolicy.apply'))
  expect(link).toHaveAttribute('href', `/action-required/arun_checkout_pr42?returnTo=${encodeURIComponent('/action-required')}`)
})
