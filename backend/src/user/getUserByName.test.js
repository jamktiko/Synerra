// src/user/getUserByName.test.js
const { handler } = require('./getUserByName');
const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

describe('getUsersByUsername handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if username is missing', async () => {
    // Use empty string instead of undefined to avoid .toLowerCase() crash
    const event = { pathParameters: { username: '' } };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'username is required',
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 if no matching users found', async () => {
    doccli.send.mockResolvedValueOnce({ Items: [] });
    const event = { pathParameters: { username: 'alice' } };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(404, {
      message: 'No matching users found',
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 with matching users', async () => {
    const items = [{ userId: '1', Username_Lower: 'alice' }];
    doccli.send.mockResolvedValueOnce({ Items: items });
    const event = { pathParameters: { username: 'alice' } };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(200, { users: items });
    expect(res.statusCode).toBe(200);
    expect(res.body.users).toEqual(items);
  });

  it('returns 500 on error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));
    const event = { pathParameters: { username: 'alice' } };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to fetch users',
    });
    expect(res.statusCode).toBe(500);
  });
});
