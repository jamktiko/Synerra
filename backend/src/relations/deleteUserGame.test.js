const { handler } = require('./deleteUserGame');
const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const {
  DeleteCommand,
  UpdateCommand,
  GetCommand,
} = require('@aws-sdk/lib-dynamodb');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

describe('removeGameRelation handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    const event = {
      requestContext: { authorizer: {} },
      pathParameters: { gameId: 'game1' },
    };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(401, { message: 'Unauthorized' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 if gameId missing', async () => {
    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      pathParameters: {},
    };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'gameId is required',
    });
    expect(res.statusCode).toBe(400);
  });

  it('removes relation successfully when relation existed', async () => {
    doccli.send
      .mockResolvedValueOnce({
        Attributes: { PK: 'USER#user1', SK: 'GAME#game1' },
      }) // DeleteCommand
      .mockResolvedValueOnce({ Item: { PlayedGames: [] } }) // GetCommand
      .mockResolvedValueOnce({ Attributes: { Popularity: 9 } }); // UpdateCommand for game popularity

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      pathParameters: { gameId: 'game1' },
    };
    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(doccli.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
    expect(sendResponse).toHaveBeenCalledWith(200, {
      message: 'Relation removed successfully',
      relation: { PK: 'USER#user1', SK: 'GAME#game1' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('removes relation successfully when game was in PlayedGames', async () => {
    doccli.send
      .mockResolvedValueOnce({}) // DeleteCommand returns no Attributes
      .mockResolvedValueOnce({ Item: { PlayedGames: [{ gameId: 'game1' }] } }) // GetCommand
      .mockResolvedValueOnce({}) // UpdateCommand for removing PlayedGames
      .mockResolvedValueOnce({ Attributes: { Popularity: 5 } }); // UpdateCommand for game popularity

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      pathParameters: { gameId: 'game1' },
    };
    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(doccli.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
    expect(sendResponse).toHaveBeenCalledWith(200, {
      message: 'Relation removed successfully',
      relation: null,
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 500 on DynamoDB error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      pathParameters: { gameId: 'game1' },
    };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to delete relation',
      error: 'DDB error',
    });
    expect(res.statusCode).toBe(500);
  });
});
