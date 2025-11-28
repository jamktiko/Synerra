const { doccli } = require('../ddbconn');
const { sendResponse, verifyUser } = require('../helpers');
const { QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const {
  AdminDeleteUserCommand,
  AdminListGroupsForUserCommand,
  AdminRemoveUserFromGroupCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

// Declare first
const mockCognitoSend = jest.fn();

// Mock Cognito client
jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  const actual = jest.requireActual(
    '@aws-sdk/client-cognito-identity-provider'
  );
  return {
    ...actual,
    CognitoIdentityProviderClient: jest.fn(() => ({
      send: mockCognitoSend,
    })),
  };
});

// Mock ddbconn and helpers
jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
  verifyUser: jest.fn(() => 'user123'),
}));

const { handler } = require('./deleteUser'); // import after mocks

describe('deleteUser handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 if user not found in DB', async () => {
    doccli.send.mockResolvedValueOnce({ Items: [] });

    const res = await handler({ requestContext: { authorizer: {} } });
    expect(sendResponse).toHaveBeenCalledWith(404, {
      message: 'User not found in DB',
    });
  });

  it('returns 400 if email missing', async () => {
    doccli.send.mockResolvedValueOnce({
      Items: [{ PK: 'USER#user123', SK: 'PROFILE' }],
    });

    const res = await handler({ requestContext: { authorizer: {} } });
    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'email missing',
    });
  });

  it('deletes user successfully', async () => {
    const items = [
      { PK: 'USER#user123', SK: 'PROFILE', Email: 'test@example.com' },
      { PK: 'USER#user123', SK: 'OTHER', Email: 'test@example.com' },
    ];
    doccli.send
      .mockResolvedValueOnce({ Items: items }) // QueryCommand
      .mockResolvedValue({}); // DeleteCommand calls

    mockCognitoSend
      .mockResolvedValueOnce({
        Groups: [{ GroupName: 'eu-north-1_oijiAdKs2_Google' }],
      }) // AdminListGroupsForUserCommand
      .mockResolvedValueOnce({}) // AdminRemoveUserFromGroupCommand
      .mockResolvedValueOnce({}); // AdminDeleteUserCommand

    const res = await handler({ requestContext: { authorizer: {} } });
    expect(sendResponse).toHaveBeenCalledWith(200, {
      message: 'User deleted from DynamoDB and Cognito successfully',
      deletedItems: items.length,
    });
  });

  it('returns 500 on error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));
    const res = await handler({ requestContext: { authorizer: {} } });
    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to delete user',
      error: 'DDB error',
    });
  });
});
