const { handler } = require('./getFriends');
const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { QueryCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

describe('getFriendsData handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if user is unauthorized', async () => {
    const event = { requestContext: { authorizer: {} } };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(401, { message: 'Unauthorized' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with empty list if no friends', async () => {
    doccli.send.mockResolvedValueOnce({ Items: [] }); // QueryCommand result

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user123' } } } },
    };
    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(sendResponse).toHaveBeenCalledWith(200, { users: [] });
    expect(res.statusCode).toBe(200);
    expect(res.body.users).toEqual([]);
  });

  it('returns 200 with friends and status', async () => {
    // First query: friends list
    doccli.send
      .mockResolvedValueOnce({
        Items: [{ SK: 'FRIEND#friend1' }, { SK: 'FRIEND#friend2' }],
      })
      // BatchGet profiles
      .mockResolvedValueOnce({
        Responses: {
          [process.env.MAIN_TABLE]: [
            { PK: 'USER#friend1', SK: 'PROFILE', name: 'Alice' },
            { PK: 'USER#friend2', SK: 'PROFILE', name: 'Bob' },
          ],
        },
      })
      // Connection query for friend1
      .mockResolvedValueOnce({ Items: [{}] })
      // Connection query for friend2
      .mockResolvedValueOnce({ Items: [] });

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user123' } } } },
    };
    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(doccli.send).toHaveBeenCalledWith(expect.any(BatchGetCommand));
    expect(sendResponse).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        message: 'Friends data retrieved',
        users: expect.arrayContaining([
          expect.objectContaining({ PK: 'USER#friend1', Status: 'online' }),
          expect.objectContaining({ PK: 'USER#friend2', Status: 'offline' }),
        ]),
      })
    );
    expect(res.statusCode).toBe(200);
  });

  it('returns 500 on DynamoDB error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user123' } } } },
    };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to fetch friends data',
      error: 'DDB error',
    });
    expect(res.statusCode).toBe(500);
  });
});
