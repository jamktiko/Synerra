// Cypress support file for E2E tests
import 'cypress-axe'
import './commands'

// Prevent uncaught exceptions from failing tests by default; adjust as needed
Cypress.on('uncaught:exception', (err, runnable) => {
  return false
})
