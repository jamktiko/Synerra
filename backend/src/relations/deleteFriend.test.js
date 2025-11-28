const { handler } = require('./deleteFriend');
const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

describe('deleteFriend handler', () => {
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

  it('returns 404 if friendship not found', async () => {
    doccli.send.mockResolvedValueOnce({}); // GetCommand returns no Item

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({ targetUserId: 'user2' }),
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(sendResponse).toHaveBeenCalledWith(404, {
      message: 'No friendship found between user1 and user2',
    });
    expect(res.statusCode).toBe(404);
  });

  it('deletes friendship successfully', async () => {
    doccli.send
      .mockResolvedValueOnce({ Item: { PK: 'USER#user1', SK: 'FRIEND#user2' } }) // GetCommand
      .mockResolvedValue({}); // DeleteCommand calls

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({ targetUserId: 'user2' }),
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    // DeleteCommand should be called twice
    const deleteCalls = doccli.send.mock.calls.filter(
      ([cmd]) => cmd instanceof DeleteCommand
    );
    expect(deleteCalls.length).toBe(2);

    expect(sendResponse).toHaveBeenCalledWith(200, {
      message: 'Friendship between user1 and user2 deleted',
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 500 on DynamoDB error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({ targetUserId: 'user2' }),
    };

    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to delete friend',
      error: 'DDB error',
    });
    expect(res.statusCode).toBe(500);
  });
});
