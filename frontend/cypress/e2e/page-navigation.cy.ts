// Verifies dashboard navigation, router transitions, and deep links with query params.
describe('Navigation & Router', () => {
  beforeEach(() => {
    cy.setupDefaultIntercepts()
    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    cy.url({ timeout: 10000 }).should('include', '/dashboard')
  })

  it('should navigate between main pages (Dashboard, Find Players, Settings)', () => {
    // Start at Dashboard
    cy.url().should('include', '/dashboard')
    cy.get('.dashboard', { timeout: 10000 }).should('exist')

    // Navigate to Find Players
    cy.visit('/dashboard/find-players')
    cy.url({ timeout: 10000 }).should('include', '/dashboard/find-players')
    cy.get('.users-container', { timeout: 10000 }).should('exist')

    // Navigate to Settings
    cy.visit('/dashboard/settings/profile')
    cy.url({ timeout: 10000 }).should('include', '/dashboard/settings')
    
    // Wait a moment for page to load
    cy.wait(1000)

    // Navigate back to Dashboard
    cy.visit('/dashboard')
    cy.url({ timeout: 10000 }).should('include', '/dashboard')
    cy.get('.dashboard', { timeout: 10000 }).should('exist')
  })

  it('should preserve query parameters and deep links in URL', () => {
    // Test query parameters preservation
    const gameId = 'game-123'
    cy.visit(`/dashboard/find-players?game=${gameId}`)
    
    // Verify URL contains query param
    cy.url({ timeout: 10000 }).should('include', `game=${gameId}`)
    
    // Verify page loaded
    cy.get('.users-container', { timeout: 10000 }).should('exist')
    
    // Test deep link to profile
    const userId = 'user-2'
    cy.intercept('GET', `**/user/${userId}`, {
      statusCode: 200,
      body: {
        PK: `USER#${userId}`,
        Username: 'TestPlayer',
        UserId: userId,
        Languages: ['en'],
        Status: 'online',
        Bio: 'Test bio'
      }
    }).as('getProfile')
    
    cy.visit(`/dashboard/profile/${userId}`)
    cy.wait('@getProfile')
    cy.url({ timeout: 10000 }).should('include', `/dashboard/profile/${userId}`)
  })
})
