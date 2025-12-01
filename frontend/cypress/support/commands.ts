// Custom Cypress commands for common E2E operations

Cypress.Commands.add('loginViaEmail', (email: string, password: string) => {
  cy.visit('/login/email');
  cy.get('input[name="email"]').clear().type(email);
  cy.get('input[name="password"]').clear().type(password);
  cy.get('form').submit();
  cy.wait('@login');
  cy.wait('@getMe');
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('setupDefaultIntercepts', () => {
  cy.intercept('POST', '**/user/login', {
    statusCode: 200,
    body: {
      token: 'fake-token',
      user: {
        PK: 'USER#user-1',
        Username: 'DemoUser',
        UserId: 'user-1',
      },
    },
  }).as('login')

  // Signup stub (avoid real backend)
  cy.intercept('POST', '**/user/signup', {
    statusCode: 201,
    body: { success: true }
  }).as('signup')

  cy.intercept('GET', '**/me', { fixture: 'me.json' }).as('getMe')
  cy.intercept('GET', '**/user', { fixture: 'users.json' }).as('getUsers')

  // User by id and games
  cy.intercept('GET', '**/user/*', (req) => {
    const id = req.url.split('/').pop() || 'user-2'
    req.reply({
      statusCode: 200,
      body: {
        PK: `USER#${id}`,
        Username: id === 'user-2' ? 'OtherPlayer' : 'DemoUser',
        UserId: id,
        Languages: ['en'],
        Bio: 'Stubbed user bio',
        Status: 'online',
        CreatedAt: 1700000000
      }
    })
  }).as('getUserById')

  cy.intercept('GET', '**/games', {
    statusCode: 200,
    body: [
      { GameId: 'game-123', Name: 'Stub Game 1' },
      { GameId: 'game-456', Name: 'Stub Game 2' }
    ]
  }).as('getGames')
  cy.intercept('POST', '**/friends/friendrequest', {
    statusCode: 200,
    body: { success: true },
  }).as('sendFriend')

  // Hiljennetään globaalisti melua aiheuttavat endpointit,
  // ellei yksittäinen testi overridea niitä omalla interceptillä.
  cy.intercept('GET', '**/friends/requests', {
    statusCode: 200,
    body: { pendingRequests: [] },
  }).as('getFriendRequests')

  cy.intercept('GET', '**/messages/unread', {
    statusCode: 200,
    body: [],
  }).as('getUnreadMessages')

  cy.intercept('GET', '**/friends/get', {
    statusCode: 200,
    body: { users: [] },
  }).as('getFriends');

  cy.intercept('GET', '**/relations/hassent', {
    statusCode: 200,
    body: { pendingRequests: [] },
  }).as('getOutgoing')

  // Profile creation helpers
  cy.intercept('GET', '**/user/username/*', {
    statusCode: 404,
    body: { message: 'Not found' }
  }).as('checkUsername')

  cy.intercept('POST', '**/relations/usergame', {
    statusCode: 201,
    body: { success: true }
  }).as('addUserGame')

  cy.intercept('PUT', '**/user/update/*', {
    statusCode: 200,
    body: { success: true }
  }).as('updateUser')

  cy.intercept('DELETE', '**/user/delete/*', {
    statusCode: 200,
    body: { success: true }
  }).as('deleteUser')
})

Cypress.Commands.add('applyTextSpacing', () => {
  // Apply WCAG 2.1 text spacing overrides to verify layout resilience
  cy.document().then((doc) => {
    const existing = doc.getElementById('cy-text-spacing-override')
    if (existing) {
      return
    }

    const style = doc.createElement('style')
    style.id = 'cy-text-spacing-override'
    style.innerHTML = `
      * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
      p { margin-bottom: 2em !important; }
    `
    doc.head.appendChild(style)
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      loginViaEmail(email: string, password: string): Chainable<void>
      setupDefaultIntercepts(): Chainable<void>
      checkA11yInjected(): Chainable<void>
      applyTextSpacing(): Chainable<void>
    }
  }
}

export {};
