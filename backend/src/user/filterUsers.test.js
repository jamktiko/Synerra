const { handler } = require('./filterUsers');
const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

describe('searchUsers handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with users when no filters provided', async () => {
    const items = [{ userId: '1', name: 'Alice' }];
    doccli.send.mockResolvedValueOnce({ Items: items });

    const event = { body: JSON.stringify({}) };
    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(sendResponse).toHaveBeenCalledWith(200, { users: items });
    expect(res.statusCode).toBe(200);
    expect(res.body.users).toEqual(items);
  });

  it('applies filters and returns 200', async () => {
    const items = [{ userId: '2', name: 'Bob' }];
    doccli.send.mockResolvedValueOnce({ Items: items });

    const event = {
      body: JSON.stringify({
        Status: 'online',
        languages: ['en', 'fi'],
        games: ['chess'],
        playstyle: 'casual',
        platform: ['pc'],
      }),
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    const calledParams = doccli.send.mock.calls[0][0].input;
    expect(calledParams.FilterExpression).toContain('#Status = :Status');
    expect(calledParams.FilterExpression).toContain(
      'contains(#Languages, :lang0)'
    );
    expect(calledParams.FilterExpression).toContain('contains(#Games, :game0)');
    expect(calledParams.FilterExpression).toContain('#Playstyle = :Playstyle');
    expect(calledParams.FilterExpression).toContain(
      'contains(#Platform, :platform0)'
    );
    expect(sendResponse).toHaveBeenCalledWith(200, { users: items });
    expect(res.statusCode).toBe(200);
  });

  it('returns 500 on DynamoDB error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));
    const event = { body: JSON.stringify({}) };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to fetch users',
    });
    expect(res.statusCode).toBe(500);
  });
});
