describe('Friend Requests (Accept/Decline)', () => {
  beforeEach(() => {
    cy.setupDefaultIntercepts()
  })

  it('should send a friend request', () => {
    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    cy.visit('/dashboard/find-players')
    cy.wait('@getUsers')

    cy.get('.users-container .card').first().within(() => {
      cy.get('button.add-btn').click()
    })

    cy.wait('@sendFriend')

    // Verify button changed state
    cy.get('.users-container .card').first().within(() => {
      cy.get('button.add-btn').should('contain.text', 'Request Sent')
    })
  })

  it('should display pending friend requests', () => {
    cy.intercept('GET', '**/friends/requests', {
      statusCode: 200,
      body: {
        pendingRequests: [
          {
            UserId: 'user-2',
            Username: 'IncomingFriend',
            ProfilePicture: null,
          },
        ],
      },
    }).as('getPendingRequests')

    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    cy.visit('/dashboard/social')

    cy.wait('@getPendingRequests')

    // Should show pending request notification or in a requests tab
    cy.get('[data-cy="pending-requests"], .requests-list, [aria-label*="request"]').should('exist')
  })

  it('should accept a friend request', () => {
    cy.intercept('GET', '**/friends/requests', {
      statusCode: 200,
      body: {
        pendingRequests: [
          {
            UserId: 'user-2',
            Username: 'IncomingFriend',
          },
        ],
      },
    }).as('getPendingRequests')

    cy.intercept('POST', '**/friends/friendrequest', {
      statusCode: 200,
      body: { success: true },
    }).as('acceptRequest')

    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    cy.visit('/dashboard/social')

    cy.wait('@getPendingRequests')

    // Find and click accept button
    cy.get('[data-cy="accept-btn"], button:contains("Accept")').first().click()

    cy.wait('@acceptRequest')

    // Request should disappear from pending list
    cy.get('[data-cy="pending-requests"], .requests-list').should('not.contain', 'IncomingFriend')
  })

  it('should decline a friend request', () => {
    cy.intercept('GET', '**/friends/requests', {
      statusCode: 200,
      body: {
        pendingRequests: [
          {
            UserId: 'user-3',
            Username: 'UnwantedFriend',
          },
        ],
      },
    }).as('getPendingRequests')

    cy.intercept('POST', '**/friends/friendrequest', {
      statusCode: 200,
      body: { success: true },
    }).as('declineRequest')

    cy.loginViaEmail('demo@mies.fi', 'Demo11')
    cy.visit('/dashboard/social')

    cy.wait('@getPendingRequests')

    // Find and click decline button
    cy.get('[data-cy="decline-btn"], button:contains("Decline")').first().click()

    cy.wait('@declineRequest')

    // Request should disappear from pending list
    cy.get('[data-cy="pending-requests"], .requests-list').should('not.contain', 'UnwantedFriend')
  })
})
