// 1. Define mock functions for Cognito methods
const mockAdminCreateUser = jest.fn();
const mockAdminSetUserPassword = jest.fn();

// 2. Mock the Cognito SDK
jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  return {
    CognitoIdentityProvider: jest.fn(() => ({
      adminCreateUser: mockAdminCreateUser,
      adminSetUserPassword: mockAdminSetUserPassword,
    })),
  };
});

// 3. Mock DynamoDB Document Client
const mockPutCommand = jest.fn();
jest.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: { from: jest.fn(() => ({ send: mockPutCommand })) },
    PutCommand: jest.fn(),
  };
});

// 4. Mock helpers
const { sendResponse, validateInput } = require('../helpers');
jest.mock('../helpers', () => ({
  sendResponse: jest.fn((status, body) => ({ statusCode: status, body })),
  validateInput: jest.fn(() => true),
}));

// 5. Import handler after mocks
const { handler } = require('./signup');

describe('signupUser Lambda', () => {
  beforeEach(() => {
    mockAdminCreateUser.mockReset();
    mockAdminSetUserPassword.mockReset();
    mockPutCommand.mockReset();
    validateInput.mockClear();
    sendResponse.mockClear();
  });

  it('successful signup returns userId', async () => {
    const mockEvent = {
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'pass123',
      }),
    };

    // Mock Cognito create user response
    mockAdminCreateUser.mockResolvedValue({
      User: {
        Username: 'mock-username',
        Attributes: [{ Name: 'sub', Value: 'mock-sub-id' }],
      },
    });

    // Mock DynamoDB put
    mockPutCommand.mockResolvedValue({});

    const res = await handler(mockEvent);

    expect(validateInput).toHaveBeenCalledWith(mockEvent.body);
    expect(mockAdminCreateUser).toHaveBeenCalled();
    expect(mockAdminSetUserPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        Username: 'newuser@example.com',
        Password: 'pass123',
        Permanent: true,
      })
    );
    expect(mockPutCommand).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      message: 'User registration successful',
      userId: 'mock-sub-id',
    });
  });

  it('returns 400 when input is invalid', async () => {
    validateInput.mockReturnValueOnce(false);
    const mockEvent = { body: '{}' };

    const res = await handler(mockEvent);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Invalid input' });
  });

  it('handles Cognito errors', async () => {
    mockAdminCreateUser.mockRejectedValueOnce(new Error('Cognito failed'));
    const mockEvent = {
      body: JSON.stringify({ email: 'fail@example.com', password: 'pass123' }),
    };

    const res = await handler(mockEvent);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Cognito failed' });
  });

  it('falls back to Username if sub is missing', async () => {
    const mockEvent = {
      body: JSON.stringify({ email: 'user2@example.com', password: 'pass123' }),
    };

    mockAdminCreateUser.mockResolvedValue({
      User: {
        Username: 'fallback-username',
        Attributes: [],
      },
    });
    mockPutCommand.mockResolvedValue({});

    const res = await handler(mockEvent);

    expect(res.body.userId).toBe('fallback-username');
  });
});
