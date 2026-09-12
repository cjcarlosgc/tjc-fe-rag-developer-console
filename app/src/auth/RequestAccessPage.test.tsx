import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RequestAccessPage } from './RequestAccessPage'
import { renderAuthPage } from './test/renderAuthPage'

describe('RequestAccessPage', () => {
  it('el botón permanece deshabilitado sin correo, y confirma el envío tras completarlo', async () => {
    const user = userEvent.setup()
    renderAuthPage(<RequestAccessPage />)
    expect(screen.getByRole('button', { name: 'Solicitar acceso' })).toBeDisabled()
    await user.type(screen.getByLabelText('Correo de trabajo'), 'nueva@empresa.com')
    await user.click(screen.getByRole('button', { name: 'Solicitar acceso' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Registramos tu solicitud. Te contactaremos si se aprueba el acceso.')
  })
})
