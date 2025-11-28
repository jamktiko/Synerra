const { handler } = require('./hasSentRequest');
const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

describe('getOutgoingFriendRequests handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if user is unauthorized', async () => {
    const event = { requestContext: { authorizer: {} } };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(401, { message: 'Unauthorized' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with pending requests', async () => {
    const items = [
      { SK: 'FRIEND_REQUEST#1', Status: 'PENDING' },
      { SK: 'FRIEND_REQUEST#2', Status: 'ACCEPTED' },
    ];
    doccli.send.mockResolvedValueOnce({ Items: items });

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user123' } } } },
    };
    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(sendResponse).toHaveBeenCalledWith(200, {
      pendingRequests: [{ SK: 'FRIEND_REQUEST#1', Status: 'PENDING' }],
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.pendingRequests.length).toBe(1);
  });

  it('returns 200 with empty list if no pending requests', async () => {
    doccli.send.mockResolvedValueOnce({ Items: [] });

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user123' } } } },
    };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(200, { pendingRequests: [] });
    expect(res.statusCode).toBe(200);
    expect(res.body.pendingRequests).toEqual([]);
  });

  it('returns 500 on DynamoDB error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user123' } } } },
    };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to retrieve outgoing pending friend requests',
      error: 'DDB error',
    });
    expect(res.statusCode).toBe(500);
  });
});
