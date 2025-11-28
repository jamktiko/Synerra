// Smoke test that covers the primary user path: login → dashboard → Find Players → back.
describe('Smoke Test', () => {
  it('should complete basic user flow: login → dashboard → find players', () => {
    cy.setupDefaultIntercepts()
    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    
    // Verify dashboard loads
    cy.get('.dashboard', { timeout: 10000 }).should('exist')
    
    // Navigate to find players
    cy.visit('/dashboard/find-players')
    cy.get('.users-container', { timeout: 10000 }).should('be.visible')
    
    // Verify we can navigate back
    cy.visit('/dashboard')
    cy.get('.dashboard', { timeout: 10000 }).should('exist')
  })
})
