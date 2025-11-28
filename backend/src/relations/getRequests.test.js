const { handler } = require('./getRequests');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { sendResponse } = require('../helpers');
const { doccli } = require('../ddbconn');

jest.mock('../helpers', () => ({
  sendResponse: jest.fn(),
}));

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

describe('getPendingRequests handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'TestTable';
  });

  test('returns 401 when no authenticated user', async () => {
    const event = {
      requestContext: {
        authorizer: { jwt: { claims: {} } },
      },
    };

    sendResponse.mockReturnValue({
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized' }),
    });

    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(401, { message: 'Unauthorized' });
    expect(res.statusCode).toBe(401);
  });

  test('returns empty array when no pending requests', async () => {
    const event = {
      requestContext: {
        authorizer: { jwt: { claims: { sub: 'mock-user-id' } } },
      },
    };

    doccli.send.mockResolvedValue({ Items: undefined });

    sendResponse.mockReturnValue({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Pending friend requests retrieved successfully',
        pendingRequests: [],
      }),
    });

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(res.statusCode).toBe(200);
  });

  test('returns 200 with mock DynamoDB items', async () => {
    const mockItem = {
      PK: 'USER#mock-user-id',
      SK: 'FRIEND_REQUEST#mock-friend-id',
      CreatedAt: 1234567890,
      GSI1PK: 'USER#mock-friend-id',
      GSI1SK: 'FRIEND_REQUEST#mock-user-id',
      Relation: 'FRIEND_REQUEST',
      SenderId: 'mock-user-id',
      SenderPicture: 'https://example.com/pic.png',
      SenderUsername: 'MockUser',
      Status: 'PENDING',
    };

    doccli.send.mockResolvedValue({ Items: [mockItem] });

    sendResponse.mockReturnValue({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Pending friend requests retrieved successfully',
        pendingRequests: [mockItem],
      }),
    });

    const event = {
      requestContext: {
        authorizer: {
          jwt: { claims: { sub: 'mock-user-id' } },
        },
      },
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(sendResponse).toHaveBeenCalledWith(200, {
      message: 'Pending friend requests retrieved successfully',
      pendingRequests: [mockItem],
    });

    expect(res.statusCode).toBe(200);
  });

  test('returns 500 when DynamoDB throws', async () => {
    doccli.send.mockRejectedValue(new Error('Dynamo crash'));

    sendResponse.mockReturnValue({
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to retrieve pending friend requests',
        error: 'Dynamo crash',
      }),
    });

    const event = {
      requestContext: {
        authorizer: { jwt: { claims: { sub: 'mock-user-id' } } },
      },
    };

    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to retrieve pending friend requests',
      error: 'Dynamo crash',
    });

    expect(res.statusCode).toBe(500);
  });
});
