const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn');
const { sendResponse, verifyAdmin } = require('../helpers');

// Mock DynamoDB client
jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

// Mock helpers
jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
  verifyAdmin: jest.fn(),
}));

// Import handler after mocks
const { handler } = require('./deleteGame');

describe('deleteGame handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'main-table';
  });

  it('returns 403 if not admin', async () => {
    verifyAdmin.mockReturnValue({ isAdmin: false, userId: 'user1' });

    const event = { pathParameters: { gameId: '123' } };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(403, {
      message: 'Admin privileges required',
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 if gameId missing', async () => {
    verifyAdmin.mockReturnValue({ isAdmin: true, userId: 'admin1' });

    const event = { pathParameters: {} };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'gameId is required',
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 if game not found', async () => {
    verifyAdmin.mockReturnValue({ isAdmin: true, userId: 'admin1' });
    doccli.send.mockResolvedValueOnce({}); // no Attributes

    const event = { pathParameters: { gameId: '123' } };
    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
    expect(sendResponse).toHaveBeenCalledWith(404, {
      message: 'Game not found',
    });
    expect(res.statusCode).toBe(404);
  });

  it('deletes game successfully', async () => {
    verifyAdmin.mockReturnValue({ isAdmin: true, userId: 'admin1' });
    const deletedGame = { PK: 'GAME#123', SK: 'DETAILS', Name: 'Chess' };
    doccli.send.mockResolvedValueOnce({ Attributes: deletedGame });

    const event = { pathParameters: { gameId: '123' } };
    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
    expect(sendResponse).toHaveBeenCalledWith(200, {
      message: 'Game deleted successfully',
      game: deletedGame,
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 500 on DynamoDB error', async () => {
    verifyAdmin.mockReturnValue({ isAdmin: true, userId: 'admin1' });
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = { pathParameters: { gameId: '123' } };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to delete game',
    });
    expect(res.statusCode).toBe(500);
  });
});
