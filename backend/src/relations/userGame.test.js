const { handler } = require('./userGame');
const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

describe('addGame handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if user is unauthorized', async () => {
    const event = { requestContext: { authorizer: {} }, body: '{}' };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(401, { message: 'Unauthorized' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 if gameId is missing', async () => {
    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user123' } } } },
      body: '{}',
    };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'gameId is required',
    });
    expect(res.statusCode).toBe(400);
  });

  it('adds game successfully', async () => {
    const popularityValue = 42;
    doccli.send
      .mockResolvedValueOnce({}) // PutCommand
      .mockResolvedValueOnce({ Attributes: { Popularity: popularityValue } }) // UpdateCommand for game popularity
      .mockResolvedValueOnce({}); // UpdateCommand for user profile

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user123' } } } },
      body: JSON.stringify({ gameId: 'game1', gameName: 'Chess' }),
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(PutCommand));
    expect(doccli.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
    expect(sendResponse).toHaveBeenCalledWith(
      201,
      expect.objectContaining({
        message: 'Game added to user successfully',
        relation: expect.objectContaining({
          PK: 'USER#user123',
          SK: 'GAME#game1',
        }),
        popularity: popularityValue,
      })
    );
    expect(res.statusCode).toBe(201);
  });

  it('returns 409 if game already linked to user', async () => {
    const error = new Error('duplicate');
    error.name = 'ConditionalCheckFailedException';
    doccli.send.mockRejectedValueOnce(error);

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user123' } } } },
      body: JSON.stringify({ gameId: 'game1', gameName: 'Chess' }),
    };

    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(409, {
      message: 'Game already linked to user',
    });
    expect(res.statusCode).toBe(409);
  });

  it('returns 500 on generic error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user123' } } } },
      body: JSON.stringify({ gameId: 'game1', gameName: 'Chess' }),
    };

    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to add game',
      error: 'DDB error',
    });
    expect(res.statusCode).toBe(500);
  });
});
