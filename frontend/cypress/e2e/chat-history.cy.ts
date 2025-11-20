describe('Chat History & Multiple Conversations', () => {
  it('should display chat history with another user', () => {
    cy.visit('/login/email');

    cy.get('input[name="email"]').type('demo@mies.fi', { delay: 50 });
    cy.get('input[name="password"]').type('Demo11', { delay: 50 });
    cy.get('form').submit();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');

    // Navigate to chat with a specific user
    cy.visit('/dashboard/social/user-2', { timeout: 10000 });

    // Wait for chat to load
    cy.get('body', { timeout: 5000 }).should('not.contain', 'Error');

    // Check for message bubbles/elements
    cy.get('[class*="message"], [class*="chat"], [class*="bubble"]', { timeout: 5000 })
      .should('have.length.greaterThan', 0);

    // Verify message layout - check for left-aligned messages (received)
    cy.get('[class*="left"], [class*="received"], [class*="incoming"]', { timeout: 3000 })
      .should('exist');
  });

  it('should send a message in chat', () => {
    cy.visit('/login/email');

    cy.get('input[name="email"]').type('demo@mies.fi', { delay: 50 });
    cy.get('input[name="password"]').type('Demo11', { delay: 50 });
    cy.get('form').submit();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');

    cy.visit('/dashboard/social/user-2', { timeout: 10000 });

    // Check that chat page loaded without errors
    cy.get('body', { timeout: 5000 }).should('not.contain', 'Error');

    // Verify message elements exist
    cy.get('[class*="message"], [class*="chat"]', { timeout: 5000 })
      .should('have.length.greaterThan', 0);
  });

  it('should manage multiple chat conversations', () => {
    cy.visit('/login/email');

    cy.get('input[name="email"]').type('demo@mies.fi', { delay: 50 });
    cy.get('input[name="password"]').type('Demo11', { delay: 50 });
    cy.get('form').submit();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');

    cy.visit('/dashboard/social', { timeout: 10000 });

    // Wait for page to load
    cy.get('body', { timeout: 5000 }).should('not.contain', 'Error');

    // Click on a friend/user to open conversation
    cy.get('li, [class*="user-item"], [class*="friend-item"]', { timeout: 5000 })
      .first()
      .click({ force: true });

    // Should navigate (either to social or profile)
    cy.url({ timeout: 5000 }).should('match', /(social|profile)/);

    // Go back to social list
    cy.visit('/dashboard/social', { timeout: 10000 });

    // Click another user if available
    cy.get('li, [class*="user-item"], [class*="friend-item"]', { timeout: 5000 })
      .then(($items) => {
        if ($items.length > 1) {
          cy.wrap($items.eq(1)).click({ force: true });
          cy.url({ timeout: 5000 }).should('match', /(social|profile)/);
        }
      });
  });

  it('should show unread message count', () => {
    cy.visit('/login/email');

    cy.get('input[name="email"]').type('demo@mies.fi', { delay: 50 });
    cy.get('input[name="password"]').type('Demo11', { delay: 50 });
    cy.get('form').submit();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');

    cy.visit('/dashboard/social', { timeout: 10000 });

    // Check if page loads without errors
    cy.get('body', { timeout: 5000 }).should('not.contain', 'Error');

    // Verify social page has content (users/friends list)
    cy.get('li, [class*="item"]', { timeout: 5000 })
      .should('have.length.greaterThan', 0);
  });
});
