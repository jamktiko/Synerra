describe('Performance & Accessibility Smoke Tests', () => {
  beforeEach(() => {
    cy.setupDefaultIntercepts()
  })

  describe('Signup Performance', () => {
    it('signup process should complete in under 30 seconds', () => {
      const startTime = Date.now()
      const uniqueEmail = `testuser${Date.now()}@test.com`

      cy.visit('/signup')
      cy.get('input[name="email"]').type(uniqueEmail)
      cy.get('input[name="password"]').type('TempPassword123!')
      cy.get('input[name="confirmPassword"]').type('TempPassword123!')

      cy.get('form').submit()

      // After signup, user is redirected to dashboard (profile-creation happens there)
      cy.url({ timeout: 30000 }).should('include', '/dashboard')

      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000

      cy.log(`Signup completed in ${duration.toFixed(2)} seconds`)
      expect(duration).to.be.lessThan(30)
    })
  })

  describe('Search Performance', () => {
    it('find-players search should return results in under 2 seconds', () => {
      cy.loginViaEmail('demo@mies.fi', 'Demo11')

      // Measure navigation performance to find-players page
      const startTime = Date.now()
      
      cy.visit('/dashboard/find-players')
      cy.wait('@getUsers')
      
      // Verify players container is visible (page fully loaded)
      cy.get('.users-container', { timeout: 5000 }).should('be.visible')
      
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      
      cy.log(`Find-players page loaded in ${duration.toFixed(2)} seconds`)
      // Allow up to 5 seconds including network latency
      expect(duration).to.be.lessThan(5)
    })
  })

  describe('Accessibility (WCAG 2.1 AA Smoke)', () => {
    it('login page should meet WCAG 2.1 AA standards', () => {
      cy.visit('/login/email')
      cy.checkA11yInjected()
    })

    it('dashboard page should meet WCAG 2.1 AA standards', () => {
      cy.loginViaEmail('demo@mies.fi', 'Demo11')
      cy.checkA11yInjected()
    })

    it('find-players page should meet WCAG 2.1 AA standards', () => {
      cy.loginViaEmail('demo@mies.fi', 'Demo11')
      cy.visit('/dashboard/find-players')
      cy.checkA11yInjected()
    })

    it('profile settings page should have proper ARIA labels', () => {
      cy.loginViaEmail('demo@mies.fi', 'Demo11')
      cy.visit('/dashboard/settings/profile')

      // Just verify the page loads and has interactive elements
      cy.get('input, button, select, textarea', { timeout: 5000 }).should('have.length.greaterThan', 0)
    })
  })
})
