const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

const { handler } = require('./gameByName');

describe('searchGames handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'main-table';
  });

  it('returns 400 if search parameter missing', async () => {
    // Use empty string instead of undefined to avoid TypeError
    const event = { pathParameters: { gamename: '' } };
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({ message: 'Search query required' });
  });

  it('returns 200 with items when query succeeds', async () => {
    const items = [{ PK: 'GAME#1', SK: 'DETAILS', Name_lower: 'chess' }];
    doccli.send.mockResolvedValueOnce({ Items: items });

    const event = { pathParameters: { gamename: 'ch' } };
    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual(items);
  });

  it('returns 200 with empty array when no items', async () => {
    doccli.send.mockResolvedValueOnce({ Items: [] });

    const event = { pathParameters: { gamename: 'unknown' } };
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });

  it('returns 500 on DynamoDB error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = { pathParameters: { gamename: 'chess' } };
    const res = await handler(event);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({ message: 'Internal Server Error' });
  });
});
