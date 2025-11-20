describe('Login and send friend request', () => {
  it('logs in with valid credentials and navigates to dashboard', () => {
    // Use real backend with actual test user
    cy.visit('/login/email');

    cy.fixture('user').then((u) => {
      cy.get('input[name="email"]').type(u.email, { delay: 50 });
      cy.get('input[name="password"]').type(u.password, { delay: 50 });
    });

    // Submit the form
    cy.get('button[type="submit"], form button:contains("Login")').first().click();

    // Wait for navigation to dashboard
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.get('body').should('not.contain', 'Login');
  });

  it('navigates to find players page and sees user list', () => {
    // Login first
    cy.visit('/login/email');

    cy.fixture('user').then((u) => {
      cy.get('input[name="email"]').type(u.email, { delay: 50 });
      cy.get('input[name="password"]').type(u.password, { delay: 50 });
    });

    cy.get('button[type="submit"], form button:contains("Login")').first().click();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');

    // Navigate to find players
    cy.visit('/dashboard/find-players', { timeout: 10000 });

    // Check if user list is visible
    cy.get('.users-container', { timeout: 5000 }).should('be.visible');
    cy.get('.users-container .card', { timeout: 5000 }).should('have.length.greaterThan', 0);
  });
});
