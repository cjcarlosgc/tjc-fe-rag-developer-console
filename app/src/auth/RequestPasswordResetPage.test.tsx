import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { setAuthModeForTests } from './authMode'
import { RequestPasswordResetPage } from './RequestPasswordResetPage'
import { renderAuthPage } from './test/renderAuthPage'

beforeEach(() => {
  setAuthModeForTests('mock')
  setDataSourceForTests('mock')
})

describe('RequestPasswordResetPage', () => {
  it('muestra el mismo mensaje de éxito exista o no la cuenta (no revela existencia)', async () => {
    const user = userEvent.setup()
    renderAuthPage(<RequestPasswordResetPage />)
    await user.type(screen.getByLabelText('Correo'), 'cualquiera@example.com')
    await user.click(screen.getByRole('button', { name: 'Enviar instrucciones' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Si el correo corresponde a una cuenta, enviamos instrucciones para restablecer la contraseña.')
  })
})
