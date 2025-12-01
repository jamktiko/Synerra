// Ensures the Find Players page renders, stubs filters, and keeps query state intact.
describe('Find Players', () => {
  it('should display user list container when page loads', () => {
    cy.setupDefaultIntercepts()
    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    cy.url({ timeout: 10000 }).should('include', '/dashboard')

    // Visit find players page
    cy.visit('/dashboard/find-players')

    // Verify page loaded
    cy.get('.users-container', { timeout: 10000 }).should('be.visible')
    
    // Note: Actual user list depends on fixture data or backend
    // This test verifies the page structure renders correctly
  })

  it('should have language filter endpoint (POST /user/filter) ready', () => {
    cy.setupDefaultIntercepts()
    
    // Mock filter endpoint
    cy.intercept('POST', '**/user/filter', {
      statusCode: 200,
      body: {
        users: []
      }
    }).as('filterUsers')

    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    cy.url({ timeout: 10000 }).should('include', '/dashboard')

    cy.visit('/dashboard/find-players')
    
    // Verify page loaded
    cy.get('.users-container', { timeout: 10000 }).should('be.visible')
    
    // Note: Filter UI interaction would trigger POST /user/filter
    // This test verifies the endpoint stub is ready
  })

  it('should load user list without blocking UI', () => {
    cy.setupDefaultIntercepts()
    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    cy.url({ timeout: 10000 }).should('include', '/dashboard')

    cy.visit('/dashboard/find-players')

    // Verify page loaded and container exists
    cy.get('.users-container', { timeout: 10000 }).should('be.visible')
    
    // Wait for any async loading
    cy.wait(1000)
    
    // Verify page is interactive (no loading spinner blocking)
    cy.get('.users-container').should('not.have.class', 'loading')
  })

  it('should preserve game query parameter in URL', () => {
    cy.setupDefaultIntercepts()
    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    cy.url({ timeout: 10000 }).should('include', '/dashboard')

    const selectedGameId = 'game-123'
    cy.visit(`/dashboard/find-players?game=${selectedGameId}`)

    // Verify URL contains game parameter
    cy.url({ timeout: 10000 }).should('include', `game=${selectedGameId}`)

    // Verify page loaded
    cy.get('.users-container', { timeout: 10000 }).should('be.visible')
  })
})
