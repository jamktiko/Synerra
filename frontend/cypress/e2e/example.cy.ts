describe('Synerra basic smoke', () => {
  it('loads the app root', () => {
    cy.visit('/')
    cy.get('body').should('exist')
  })
})
