const { handler } = require('./clearUnreadsPerUser');
const { doccli } = require('../ddbconn');
const { QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

describe('clearAllUnreads handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if userId is missing', async () => {
    const event = { requestContext: { authorizer: { jwt: { claims: {} } } } };
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({
      success: false,
      message: 'Missing userId',
    });
  });

  it('returns 200 with deleted=0 if no unread messages', async () => {
    doccli.send.mockResolvedValueOnce({ Items: [] }); // QueryCommand result

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: '123' } } } },
    };
    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ success: true, deleted: 0 });
  });

  it('deletes unread messages and returns 200 with count', async () => {
    const items = [
      { PK: 'USER#123', SK: 'UNREAD#1' },
      { PK: 'USER#123', SK: 'UNREAD#2' },
    ];
    doccli.send
      .mockResolvedValueOnce({ Items: items }) // QueryCommand
      .mockResolvedValue({}); // DeleteCommand calls

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: '123' } } } },
    };
    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    // DeleteCommand should be called for each unread message
    const deleteCalls = doccli.send.mock.calls.filter(
      ([cmd]) => cmd instanceof DeleteCommand
    );
    expect(deleteCalls.length).toBe(items.length);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      success: true,
      deleted: items.length,
    });
  });

  it('returns 500 on DynamoDB error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: '123' } } } },
    };
    const res = await handler(event);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({
      success: false,
      error: 'DDB error',
    });
  });
});
