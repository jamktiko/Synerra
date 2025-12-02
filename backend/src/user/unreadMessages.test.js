const { handler } = require('./unreadMessages');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

describe('getUnreadMessages handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'TestTable';
  });

  test('returns 200 with unread messages', async () => {
    const mockItems = [
      {
        PK: 'USER#mock-user-id',
        SK: 'UNREAD#1111111111111',
        Content: 'Test message content',
        GSI1PK: 'USER#mock-user-id',
        GSI1SK: 'UNREAD#1111111111111',
        MessageId: 1111111111111,
        ProfilePicture: 'https://example.com/profile-picture/mock1.gif',
        RoomId: 'room-mock-1',
        SenderId: 'sender-mock-1',
        SenderUsername: 'MockUser1',
        Timestamp: 1111111111111,
      },
      {
        PK: 'USER#mock-user-id',
        SK: 'UNREAD#2222222222222',
        Content: 'Another test message',
        GSI1PK: 'USER#mock-user-id',
        GSI1SK: 'UNREAD#2222222222222',
        MessageId: 2222222222222,
        ProfilePicture: 'https://example.com/profile-picture/mock2.gif',
        RoomId: 'room-mock-2',
        SenderId: 'sender-mock-2',
        SenderUsername: 'MockUser2',
        Timestamp: 2222222222222,
      },
    ];

    doccli.send.mockResolvedValue({ Items: mockItems });

    const event = {
      requestContext: {
        authorizer: { jwt: { claims: { sub: 'mock-user-id' } } },
      },
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual(mockItems);
  });

  test('returns 500 if DynamoDB throws an error', async () => {
    doccli.send.mockRejectedValue(new Error('Dynamo failure'));

    const event = {
      requestContext: {
        authorizer: { jwt: { claims: { sub: 'mock-user-id' } } },
      },
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toBe('Internal server error');
  });

  test('handles missing userId gracefully', async () => {
    const event = {
      requestContext: { authorizer: { jwt: { claims: {} } } },
    };

    doccli.send.mockResolvedValue({ Items: [] });

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });
});
