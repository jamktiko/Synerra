const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn');

// Mock DynamoDB client
jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

// Import handler after mocks
const { handler } = require('./listGames');

describe('listGames handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'main-table';
  });

  it('returns 200 with items when query succeeds', async () => {
    const items = [
      { PK: 'GAME#1', SK: 'DETAILS', Name: 'CS' },
      { PK: 'GAME#2', SK: 'DETAILS', Name: 'LOL' },
    ];
    doccli.send.mockResolvedValueOnce({ Items: items });

    const res = await handler();

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual(items);
  });

  it('returns 200 with empty array when no items', async () => {
    doccli.send.mockResolvedValueOnce({ Items: [] });

    const res = await handler();

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });

  it('returns 500 on DynamoDB error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const res = await handler();

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({ message: 'Failed to list games' });
  });
});
