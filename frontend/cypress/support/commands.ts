// Custom Cypress commands for common E2E operations

Cypress.Commands.add('loginViaEmail', (email: string, password: string) => {
  cy.visit('/login/email')
  cy.get('input[name="email"]').clear().type(email)
  cy.get('input[name="password"]').clear().type(password)
  cy.get('form').submit()
  cy.wait('@login')
  cy.wait('@getMe')
  cy.url().should('include', '/dashboard')
})

Cypress.Commands.add('setupDefaultIntercepts', () => {
  cy.intercept('POST', '**/user/login', {
    statusCode: 200,
    body: { token: 'fake-token', user: { Username: 'DemoUser', UserId: 'user-1' } },
  }).as('login')

  cy.intercept('GET', '**/me', { fixture: 'me.json' }).as('getMe')
  cy.intercept('GET', '**/user', { fixture: 'users.json' }).as('getUsers')
  cy.intercept('POST', '**/friends/friendrequest', {
    statusCode: 200,
    body: { success: true },
  }).as('sendFriend')

  cy.intercept('GET', '**/friends/get', {
    statusCode: 200,
    body: { users: [] },
  }).as('getFriends')

  cy.intercept('GET', '**/relations/hassent', {
    statusCode: 200,
    body: { pendingRequests: [] },
  }).as('getOutgoing')
})

Cypress.Commands.add('checkA11yInjected', () => {
  // Inject axe and run WCAG 2.1 AA checks (includes color-contrast)
  // Requires dev dependency: cypress-axe and axe-core
  cy.injectAxe()
  cy.checkA11y(
    null,
    { runOnly: { type: 'tag', values: ['wcag2aa'] } },
    (violations) => {
      if (violations.length > 0) {
        // Log each violation to console for easier debugging
        // eslint-disable-next-line no-console
        console.warn('Accessibility violations found:', violations)
        // Write a JSON report to `cypress/reports` for CI/inspection
        const ts = Date.now()
        // use cy.writeFile to create a machine-readable report
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - cy.writeFile is provided by Cypress runtime
        cy.writeFile(`cypress/reports/a11y-violations-${ts}.json`, violations)
        // Fail the test so CI reports the accessibility issues
        throw new Error(`${violations.length} accessibility violations found. See console and cypress/reports for details.`)
      }
    }
  )
})

declare global {
  namespace Cypress {
    interface Chainable {
      loginViaEmail(email: string, password: string): Chainable<void>
      setupDefaultIntercepts(): Chainable<void>
      checkA11yInjected(): Chainable<void>
    }
  }
}

export {}
