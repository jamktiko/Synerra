describe('Session Persistence', () => {
  beforeEach(() => {
    cy.setupDefaultIntercepts()
  })

  it('session should persist after page reload', () => {
    cy.loginViaEmail('demo@mies.fi', 'Demo11')

    // Verify we're logged in
    cy.url().should('include', '/dashboard')

    // Simulate page reload
    cy.reload()

    // After reload, should still be on dashboard (session persisted)
    cy.url().should('include', '/dashboard')

    // Verify user data is still available
    cy.wait('@getMe')
  })

  it('user should remain logged in after browser back/forward', () => {
    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    cy.url().should('include', '/dashboard')

    // Navigate to another page
    cy.visit('/dashboard/find-players')
    cy.wait('@getUsers')

    // Go back
    cy.go('back')
    cy.url().should('include', '/dashboard')

    // Should not require re-login
    cy.get('body').should('not.contain', 'Login with email')
  })

  it('logout should clear session', () => {
    cy.loginViaEmail('demo@mies.fi', 'Demo11')

    cy.intercept('POST', '**/logout', { statusCode: 200 }).as('logout')

    // Find and click logout button (typically in navbar/settings)
    cy.get('[aria-label*="Logout"], button:contains("Logout"), a:contains("Logout")').first().click()

    cy.wait('@logout', { timeout: 5000 })

    // Should redirect to login
    cy.url().should('include', '/login')
  })
})
