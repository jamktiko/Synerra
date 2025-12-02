const { handler } = require('./getUserById');
const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

describe('getUserById handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if userId is missing', async () => {
    const event = { pathParameters: { userId: '' } }; // empty string avoids crash
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'userId is required',
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 if user not found', async () => {
    doccli.send.mockResolvedValueOnce({}); // no Item
    const event = { pathParameters: { userId: '123' } };
    const res = await handler(event);
    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(sendResponse).toHaveBeenCalledWith(404, {
      message: 'User not found',
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 with user item', async () => {
    const item = { PK: 'USER#123', SK: 'PROFILE', name: 'Alice' };
    doccli.send.mockResolvedValueOnce({ Item: item });
    const event = { pathParameters: { userId: '123' } };
    const res = await handler(event);
    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(sendResponse).toHaveBeenCalledWith(200, item);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(item);
  });

  it('returns 500 on error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));
    const event = { pathParameters: { userId: '123' } };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to fetch user',
    });
    expect(res.statusCode).toBe(500);
  });
});
