// Checks that individual player profiles open directly and render key sections.
describe('Player Profile', () => {
  beforeEach(() => {
    cy.setupDefaultIntercepts()
    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    cy.url({ timeout: 10000 }).should('include', '/dashboard')
  })

  it('should load profile page with correct URL pattern', () => {
    // Navigate directly to a profile using stubbed user ID
    cy.visit('/dashboard/profile/user-2')

    // Verify URL matches profile pattern
    cy.url({ timeout: 10000 }).should('match', /\/dashboard\/profile\/[\w-]+/)
    
    // Verify profile layout loaded
    cy.get('.layout, .profile-header-container', { timeout: 10000 }).should('exist')
  })

  it('should render profile main structure and sections', () => {
    // Visit profile page (uses stubbed data from setupDefaultIntercepts)
    cy.visit('/dashboard/profile/user-2')

    // Verify profile layout loaded
    cy.get('.layout, .profile-header-container', { timeout: 10000 }).should('exist')

    // Verify main sections exist
    cy.get('.user-info-section, .username', { timeout: 10000 }).should('exist')
    
    // Verify profile content area exists
    cy.get('.profile-content-container, .attributes-section', { timeout: 10000 }).should('exist')
  })
})
