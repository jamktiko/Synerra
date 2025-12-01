// login.test.js

// Define the mock function at the top, which will be used to simulate Cognito responses
const mockAdminInitiateAuth = jest.fn();

// Mock the Cognito SDK so we can control its behavior in tests
jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  return {
    CognitoIdentityProvider: jest.fn(() => ({
      adminInitiateAuth: mockAdminInitiateAuth, // use the mock function for adminInitiateAuth
    })),
  };
});

// Import helpers and mock them so we can track calls and control return values
const { sendResponse, validateInput } = require('../helpers');
jest.mock('../helpers', () => ({
  sendResponse: jest.fn((status, body) => ({ statusCode: status, body })), // return a simple response object
  validateInput: jest.fn(() => true), // assume input is always valid
}));

// Import the lambda handler after mocks, so they are applied in the handler
const { handler } = require('./login');

describe('loginUser Lambda', () => {
  // Reset mocks before each test to avoid interference between tests
  beforeEach(() => {
    mockAdminInitiateAuth.mockReset();
    validateInput.mockClear();
    sendResponse.mockClear();
  });

  it('successful login returns tokens', async () => {
    // Test case for successful login
    const mockEvent = {
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    };

    // Mock Cognito response to return tokens
    mockAdminInitiateAuth.mockResolvedValue({
      AuthenticationResult: {
        IdToken: 'id-token-mock',
        AccessToken: 'access-token-mock',
        RefreshToken: 'refresh-token-mock',
      },
    });

    // Call the lambda handler
    const res = await handler(mockEvent);

    // Verify input validation and Cognito call with expected parameters
    expect(validateInput).toHaveBeenCalledWith(mockEvent.body);
    expect(mockAdminInitiateAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: 'test@example.com',
          PASSWORD: 'password123',
        },
      })
    );

    // Verify the final response
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      message: 'Success',
      token: 'id-token-mock',
      accessToken: 'access-token-mock',
      refreshToken: 'refresh-token-mock',
    });
  });

  it('handles UserNotFoundException', async () => {
    // Test case when the user does not exist
    const mockEvent = {
      body: JSON.stringify({
        email: 'noone@example.com',
        password: 'password123',
      }),
    };

    // Mock Cognito to throw UserNotFoundException
    mockAdminInitiateAuth.mockRejectedValueOnce({
      name: 'UserNotFoundException',
    });

    const res = await handler(mockEvent);

    // Verify response matches expected error handling
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'User does not exist' });
  });

  it('handles NotAuthorizedException', async () => {
    // Test case for incorrect password
    const mockEvent = {
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpass',
      }),
    };

    // Mock Cognito to throw NotAuthorizedException
    mockAdminInitiateAuth.mockRejectedValueOnce({
      name: 'NotAuthorizedException',
    });

    const res = await handler(mockEvent);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Wrong email or password' });
  });

  it('handles generic errors', async () => {
    // Test case for other types of errors
    const mockEvent = {
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    };

    // Mock Cognito to throw a general error
    mockAdminInitiateAuth.mockRejectedValueOnce(
      new Error('Some internal error')
    );

    const res = await handler(mockEvent);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Some internal error' });
  });
});
