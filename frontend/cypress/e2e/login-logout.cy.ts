/// <reference types="cypress" />
// Covers the full authentication journey: successful login, error states, and logout cleanup.

describe('Authentication & Dashboard', () => {
  beforeEach(() => {
    cy.setupDefaultIntercepts()
  })

  it('should login successfully with valid credentials and redirect to dashboard', () => {
    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    
    // Verify successful redirect to dashboard
    cy.url({ timeout: 10000 }).should('include', '/dashboard')
    
    // Verify dashboard content loaded
    cy.get('.dashboard', { timeout: 10000 }).should('exist')
    
    // Verify user is authenticated
    cy.window().then((win) => {
      const token = win.localStorage.getItem('auth_token')
      expect(token).to.exist
      expect(token).to.not.be.empty
    })
  })

  it('should show error message on invalid password and remain on login page', () => {
    // Stub login to return error
    cy.intercept('POST', '**/user/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' }
    }).as('loginFail')

    cy.visit('/login/email')
    cy.get('input[name="email"]').clear().type('demo@mies.fi')
    cy.get('input[name="password"]').clear().type('WrongPassword123')
    cy.get('form').submit()
    
    cy.wait('@loginFail')
    
    // Should still be on login page
    cy.url().should('include', '/login')
    
    // Should show error message - check for the error text element
    cy.get('.errorText', { timeout: 5000 }).should('contain.text', 'Wrong password or email')
    
    // Should not have auth token
    cy.window().then((win) => {
      const token = win.localStorage.getItem('auth_token')
      expect(token).to.be.null
    })
  })

  it('should logout successfully and redirect to login page', () => {
    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    cy.url({ timeout: 10000 }).should('include', '/dashboard')
    
    // Logout
    cy.get('.logout-btn', { timeout: 10000 }).should('be.visible').click()
    
    // Verify redirect to login
    cy.url({ timeout: 10000 }).should('include', '/login')
    
    // Verify token cleared
    cy.window().then((win) => {
      const token = win.localStorage.getItem('auth_token')
      expect(token).to.be.null
    })
  })
})
