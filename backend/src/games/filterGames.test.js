const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');

// Mock DynamoDB client
jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

// Mock helpers
jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

// Import handler after mocks
const { handler } = require('./filterGames');

describe('filterGames handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'main-table';
  });

  it('returns 200 with all games sorted by popularity', async () => {
    const items = [
      {
        PK: 'GAME#1',
        SK: 'DETAILS',
        Name: 'Chess',
        Genre: 'Board',
        Popularity: 5,
      },
      {
        PK: 'GAME#2',
        SK: 'DETAILS',
        Name: 'Go',
        Genre: 'Board',
        Popularity: 10,
      },
    ];
    doccli.send.mockResolvedValueOnce({ Items: items });

    const event = { queryStringParameters: {} };
    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(ScanCommand));
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.games[0].Popularity).toBeGreaterThanOrEqual(
      body.games[1].Popularity
    );
  });

  it('filters by name', async () => {
    const items = [
      {
        PK: 'GAME#1',
        SK: 'DETAILS',
        Name: 'Chess',
        Genre: 'Board',
        Popularity: 5,
      },
      {
        PK: 'GAME#2',
        SK: 'DETAILS',
        Name: 'Go',
        Genre: 'Board',
        Popularity: 10,
      },
    ];
    doccli.send.mockResolvedValueOnce({ Items: items });

    const event = { queryStringParameters: { name: 'chess' } };
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    expect(res.body.games).toEqual([
      expect.objectContaining({ Name: 'Chess' }),
    ]);
  });

  it('filters by genre', async () => {
    const items = [
      {
        PK: 'GAME#1',
        SK: 'DETAILS',
        Name: 'Chess',
        Genre: 'Board',
        Popularity: 5,
      },
      {
        PK: 'GAME#2',
        SK: 'DETAILS',
        Name: 'Go',
        Genre: 'Strategy',
        Popularity: 10,
      },
    ];
    doccli.send.mockResolvedValueOnce({ Items: items });

    const event = { queryStringParameters: { genre: 'board' } };
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    expect(res.body.games).toEqual([
      expect.objectContaining({ Genre: 'Board' }),
    ]);
  });

  it('filters by both name and genre', async () => {
    const items = [
      {
        PK: 'GAME#1',
        SK: 'DETAILS',
        Name: 'Chess',
        Genre: 'Board',
        Popularity: 5,
      },
      {
        PK: 'GAME#2',
        SK: 'DETAILS',
        Name: 'Go',
        Genre: 'Board',
        Popularity: 10,
      },
    ];
    doccli.send.mockResolvedValueOnce({ Items: items });

    const event = { queryStringParameters: { name: 'go', genre: 'board' } };
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    expect(res.body.games).toEqual([
      expect.objectContaining({ Name: 'Go', Genre: 'Board' }),
    ]);
  });

  it('returns 500 on DynamoDB error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = { queryStringParameters: {} };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to filter games',
      error: 'DDB error',
    });
    expect(res.statusCode).toBe(500);
  });
});
