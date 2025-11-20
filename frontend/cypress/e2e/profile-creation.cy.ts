describe('Profile Creation & Username Setup', () => {
  it('should complete full profile creation from signup to game selection', () => {
    cy.visit('/signup')

    // Generate unique email and username to avoid conflicts
    const timestamp = Date.now()
    const newEmail = `player${timestamp}@test.com`
    const newUsername = `user${timestamp.toString().slice(-8)}`

    // Step 1: Signup
    cy.get('input[name="email"]').type(newEmail, { delay: 50 })
    cy.get('input[name="password"]').type('SecurePass123!', { delay: 50 })
    cy.get('input[name="confirmPassword"]').type('SecurePass123!', { delay: 50 })
    cy.get('form').submit()

    // Should redirect to profile-creation page
    cy.url({ timeout: 10000 }).should('include', '/profile-creation')

    // Step 2: Click "Create Profile" button
    cy.contains('button', 'Create Profile', { timeout: 5000 }).click()

    // Step 3: Enter username
    cy.get('input[name="username"]', { timeout: 5000 }).type(newUsername, { delay: 50 })
    cy.contains('button', 'Next', { timeout: 5000 }).click()

    // Step 4: Set birthday and select languages
    cy.get('input[name="birthday"]', { timeout: 5000 }).type('1995-06-15', { delay: 50 })

    // Open language dropdown and select a language from checkbox
    cy.get('button#dropdownManual', { timeout: 5000 }).click()
    cy.get('.dropBox input[type="checkbox"]', { timeout: 5000 }).first().check({ force: true })
    // Close the dropdown so the component processes the selection
    cy.get('button#dropdownManual').click()
    // Wait until Next is enabled (component updates can be async)
    cy.contains('button', 'Next', { timeout: 10000 }).as('nextBtn')
    cy.get('@nextBtn').should('be.visible').and('not.be.disabled')
    cy.get('@nextBtn').click()

    // Step 5: Select games (or skip)
    cy.get('.gameCards .card', { timeout: 5000 }).first().click()

    // Wait until Next is enabled after selecting a game
    cy.contains('button', 'Next', { timeout: 10000 }).as('nextBtnGames')
    cy.get('@nextBtnGames').should('be.visible').and('not.be.disabled')
    cy.get('@nextBtnGames').click()

    // Should complete and redirect to dashboard
    cy.url({ timeout: 10000 }).should('include', '/dashboard')

    // Navigate to account settings and verify Delete account UI exists
    cy.visit('/dashboard/settings/account')
    cy.get('.danger-zone', { timeout: 5000 }).should('be.visible')
    cy.get('.delete-button').should('exist').click()
    // Confirmation panel is shown by the component (placeholder implementation)
    cy.get('.danger-confirmation', { timeout: 5000 }).should('be.visible')
    // Click the confirm delete button in the confirmation panel
    cy.contains('Confirm delete', { timeout: 5000 }).click()
    // The component shows a feedback message after confirming (placeholder)
    cy.contains('Account deletion request sent', { timeout: 5000 }).should('be.visible')

    // Cleanup: delete the created user via backend API and clear localStorage token
    cy.window().then((win) => {
      const token = win.localStorage.getItem('auth_token')
      if (!token) {
        // nothing to do
        // eslint-disable-next-line no-console
        console.warn('No auth token present; skipping API cleanup')
        return
      }

      const apiBase = Cypress.env('API_BASE') || 'https://aswrur56pa.execute-api.eu-north-1.amazonaws.com'

      // Get user info to obtain userId
      cy.request({
        method: 'GET',
        url: `${apiBase}/me`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((meRes) => {
        const userId = meRes.body?.UserId || meRes.body?.userId || meRes.body?.user?.UserId
        if (!userId) {
          // eslint-disable-next-line no-console
          console.warn('Could not determine userId from /me response', meRes.body)
          // still clear token to avoid lingering session
          win.localStorage.removeItem('auth_token')
          return
        }

        // Call delete endpoint
        cy.request({
          method: 'DELETE',
          url: `${apiBase}/user/delete/${userId}`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        }).then((delRes) => {
          // Accept 200/204 as success; log otherwise
          if (![200, 204].includes(delRes.status)) {
            // eslint-disable-next-line no-console
            console.warn('User deletion returned non-200 status', delRes.status, delRes.body)
          }
          // Clear the local token to complete cleanup
          win.localStorage.removeItem('auth_token')
          const postToken = win.localStorage.getItem('auth_token')
          expect(postToken).to.be.null
        })
      })
    })
  })
})
