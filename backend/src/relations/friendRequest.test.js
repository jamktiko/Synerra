const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const notificationLambda = require('../notifications/notifSend');
const {
  PutCommand,
  DeleteCommand,
  GetCommand,
} = require('@aws-sdk/lib-dynamodb');

// Mock DynamoDB client
jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

// Mock helpers
jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

// Mock notification lambda
jest.mock('../notifications/notifSend', () => ({
  handler: jest.fn(),
}));

// Mock ApiGatewayV2Client so getWebSocketEndpoint works
jest.mock('@aws-sdk/client-apigatewayv2', () => ({
  ApiGatewayV2Client: jest.fn(() => ({
    send: jest.fn().mockResolvedValue({
      Items: [
        {
          Name: 'dev-synerra-backend-websockets',
          ApiEndpoint: 'wss://example.com',
        },
      ],
    }),
  })),
  GetApisCommand: jest.fn(),
}));

// Import handler after mocks
const { handler } = require('./friendRequest');

describe('friendRequest handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    const event = { requestContext: { authorizer: {} } };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(401, { message: 'Unauthorized' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 if targetUserId or action missing', async () => {
    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: '{}',
    };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'targetUserId and action are required',
    });
    expect(res.statusCode).toBe(400);
  });

  it('sends friend request successfully', async () => {
    doccli.send
      .mockResolvedValueOnce({
        Item: { Username: 'Alice', ProfilePicture: 'pfp.png' },
      }) // GetCommand
      .mockResolvedValueOnce({}); // PutCommand

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({ targetUserId: 'user2', action: 'SEND' }),
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(doccli.send).toHaveBeenCalledWith(expect.any(PutCommand));
    expect(notificationLambda.handler).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith(
      201,
      expect.objectContaining({
        message: 'Friend request sent',
      })
    );
    expect(res.statusCode).toBe(201);
  });

  it('accepts friend request successfully', async () => {
    doccli.send
      .mockResolvedValueOnce({
        Item: { Username: 'Alice', ProfilePicture: 'pfp.png' },
      }) // GetCommand
      .mockResolvedValue({}); // subsequent Put/Delete commands

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({ targetUserId: 'user2', action: 'ACCEPT' }),
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(notificationLambda.handler).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        message: 'Friend request accepted',
      })
    );
    expect(res.statusCode).toBe(200);
  });

  it('declines friend request successfully', async () => {
    doccli.send
      .mockResolvedValueOnce({
        Item: { Username: 'Alice', ProfilePicture: 'pfp.png' },
      }) // GetCommand
      .mockResolvedValue({}); // subsequent Delete/Put commands

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({ targetUserId: 'user2', action: 'DECLINE' }),
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(notificationLambda.handler).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith(200, {
      message: 'Friend request declined',
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 400 if action invalid', async () => {
    doccli.send.mockResolvedValueOnce({ Item: {} }); // GetCommand
    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({ targetUserId: 'user2', action: 'INVALID' }),
    };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'Invalid action',
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 if duplicate request', async () => {
    const error = new Error('duplicate');
    error.name = 'ConditionalCheckFailedException';
    doccli.send.mockRejectedValueOnce(error);

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({ targetUserId: 'user2', action: 'SEND' }),
    };

    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(409, {
      message: 'Friend request already exists',
    });
    expect(res.statusCode).toBe(409);
  });

  it('returns 500 on generic error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));
    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({ targetUserId: 'user2', action: 'SEND' }),
    };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to process friend request',
      error: 'DDB error',
    });
    expect(res.statusCode).toBe(500);
  });
});
