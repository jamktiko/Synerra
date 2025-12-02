const { handler } = require('./deleteUnreads');
const { doccli } = require('../ddbconn');
const { QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

describe('markRoomMessagesRead handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes unread messages in the room and returns 200', async () => {
    const unreadItems = [
      { PK: 'USER#123', SK: 'UNREAD#1', RoomId: 'room1' },
      { PK: 'USER#123', SK: 'UNREAD#2', RoomId: 'room1' },
      { PK: 'USER#123', SK: 'UNREAD#3', RoomId: 'room2' }, // different room
    ];
    doccli.send
      .mockResolvedValueOnce({ Items: unreadItems }) // QueryCommand
      .mockResolvedValue({}); // DeleteCommand calls

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: '123' } } } },
      pathParameters: { roomId: 'room1' },
    };

    const res = await handler(event);

    // First call should be a QueryCommand
    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    // DeleteCommand should be called for the two messages in room1
    expect(doccli.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
    expect(
      doccli.send.mock.calls.filter(([cmd]) => cmd instanceof DeleteCommand)
        .length
    ).toBe(2);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ success: true });
  });

  it('returns 200 when no unread messages in the room', async () => {
    doccli.send.mockResolvedValueOnce({ Items: [] }); // QueryCommand returns empty

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: '123' } } } },
      pathParameters: { roomId: 'room1' },
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    // No DeleteCommand calls
    expect(
      doccli.send.mock.calls.filter(([cmd]) => cmd instanceof DeleteCommand)
        .length
    ).toBe(0);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ success: true });
  });

  it('returns 500 on DynamoDB error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: '123' } } } },
      pathParameters: { roomId: 'room1' },
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({
      success: false,
      error: 'DDB error',
    });
  });
});
