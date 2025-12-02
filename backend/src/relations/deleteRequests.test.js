const { handler } = require('./deleteRequests');
const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

describe('clearFriendRequests handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    const event = { requestContext: { authorizer: {} }, body: '{}' };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(401, { message: 'Unauthorized' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 if targetUserId missing', async () => {
    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: '{}',
    };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'targetUserId is required',
    });
    expect(res.statusCode).toBe(400);
  });

  it('deletes requests successfully', async () => {
    const items = [
      { PK: 'USER#user1', SK: 'FRIEND_REQUEST#user2', Status: 'ACCEPTED' },
      { PK: 'USER#user1', SK: 'FRIEND_REQUEST#user3', Status: 'DECLINED' },
    ];
    doccli.send
      .mockResolvedValueOnce({ Items: items }) // QueryCommand
      .mockResolvedValue({}); // DeleteCommand calls

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({ targetUserId: 'userX' }),
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    // DeleteCommand should be called for each item
    const deleteCalls = doccli.send.mock.calls.filter(
      ([cmd]) => cmd instanceof DeleteCommand
    );
    expect(deleteCalls.length).toBe(items.length);

    expect(sendResponse).toHaveBeenCalledWith(200, {
      message: 'Accepted and declined friend requests deleted successfully',
      deletedCount: items.length,
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 200 with deletedCount=0 if no requests', async () => {
    doccli.send.mockResolvedValueOnce({ Items: [] });

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({ targetUserId: 'userX' }),
    };

    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(200, {
      message: 'Accepted and declined friend requests deleted successfully',
      deletedCount: 0,
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 500 on DynamoDB error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({ targetUserId: 'userX' }),
    };

    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to clear friend requests',
      error: 'DDB error',
    });
    expect(res.statusCode).toBe(500);
  });
});
