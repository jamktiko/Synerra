const { handler } = require('./getUserRooms');
const {
  QueryCommand,
  GetCommand,
  BatchGetCommand,
} = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

describe('getUserRooms handler with member data format', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'TestTable';
  });

  test('returns rooms with members in CHAT#USER# format', async () => {
    const mockRooms = [
      {
        RoomId: 'd49c6099-8299-456f-93d1-1e24581cc228',
        UserId: '10cc295c-9051-7045-46a9-47b02ebcd5f2',
      },
    ];

    const mockRoomMeta = {
      Item: {
        RoomId: 'd49c6099-8299-456f-93d1-1e24581cc228',
        Users: ['10cc295c-9051-7045-46a9-47b02ebcd5f2', 'user-2'],
      },
    };

    const mockBatchUsers = {
      Responses: {
        TestTable: [
          {
            PK: 'USER#10cc295c-9051-7045-46a9-47b02ebcd5f2',
            SK: 'PROFILE',
            Username: 'Alice',
          },
          {
            PK: 'USER#user-2',
            SK: 'PROFILE',
            Username: 'Bob',
          },
        ],
      },
    };

    doccli.send.mockImplementation((cmd) => {
      if (cmd instanceof QueryCommand)
        return Promise.resolve({ Items: mockRooms });
      if (cmd instanceof GetCommand) return Promise.resolve(mockRoomMeta);
      if (cmd instanceof BatchGetCommand)
        return Promise.resolve(mockBatchUsers);
      return Promise.resolve({});
    });

    const event = {
      pathParameters: { userId: '10cc295c-9051-7045-46a9-47b02ebcd5f2' },
    };
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.rooms).toHaveLength(1);
    expect(body.rooms[0].RoomId).toBe('d49c6099-8299-456f-93d1-1e24581cc228');
    expect(body.rooms[0].Members).toHaveLength(2);
    expect(body.rooms[0].Members[0].Username).toBe('Alice');
  });

  test('returns 500 if DynamoDB throws error', async () => {
    doccli.send.mockRejectedValue(new Error('Dynamo failure'));
    const event = {
      pathParameters: { userId: '10cc295c-9051-7045-46a9-47b02ebcd5f2' },
    };
    const res = await handler(event);
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.message).toBe('Failed to fetch user rooms with members');
  });

  test('handles rooms with no members', async () => {
    const mockRooms = [
      { RoomId: 'room-empty', UserId: '10cc295c-9051-7045-46a9-47b02ebcd5f2' },
    ];
    const mockRoomMeta = { Item: { RoomId: 'room-empty', Users: [] } };

    doccli.send.mockImplementation((cmd) => {
      if (cmd instanceof QueryCommand)
        return Promise.resolve({ Items: mockRooms });
      if (cmd instanceof GetCommand) return Promise.resolve(mockRoomMeta);
      return Promise.resolve({});
    });

    const event = {
      pathParameters: { userId: '10cc295c-9051-7045-46a9-47b02ebcd5f2' },
    };
    const res = await handler(event);
    const body = JSON.parse(res.body);
    expect(body.rooms[0].Members).toEqual([]);
  });
});
