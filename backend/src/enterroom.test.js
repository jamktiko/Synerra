const { handler } = require('./enterroom.js');
const { doccli } = require('./ddbconn.js');
const {
  ApiGatewayManagementApiClient,
} = require('@aws-sdk/client-apigatewaymanagementapi');

// Mocking aws sdk and it's commands
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  PutCommand: jest.fn(),
  QueryCommand: jest.fn(),
  GetCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-apigatewaymanagementapi', () => {
  const sendMock = jest.fn().mockResolvedValue({});

  // Make PostToConnectionCommand a constructor that returns the params
  const PostToConnectionCommand = jest.fn(function (params) {
    return { ...params };
  });

  return {
    ApiGatewayManagementApiClient: jest.fn(() => ({ send: sendMock })),
    PostToConnectionCommand,
    __esModule: true,
  };
});

jest.mock('./ddbconn.js', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-room-id') }));

describe('enterRoomHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'MainTable';
    process.env.CONNECTION_DB_TABLE = 'ConnTable';
  });

  it('returns 400 if no userId', async () => {
    const res = await handler({
      requestContext: { authorizer: {}, connectionId: 'abc' },
      body: '{}',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toBe('Missing userId');
  });

  it('returns 400 if no connectionId', async () => {
    const res = await handler({
      requestContext: { authorizer: { sub: 'u1' } },
      body: '{}',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toBe('Missing connectionId');
  });

  it('joins room via targetRoomId', async () => {
    // mock user rooms query
    doccli.send.mockResolvedValueOnce({
      Items: [{ RoomId: 'room1' }],
    });
    // mock put connection
    doccli.send.mockResolvedValueOnce({});

    const event = {
      requestContext: {
        connectionId: 'conn123',
        authorizer: { sub: 'user1' },
        domainName: 'localhost',
        stage: 'dev',
      },
      body: JSON.stringify({ targetRoomId: 'room1' }),
    };

    const result = await handler(event);
    // Test passes when receiving success (200) and the mocked ApiGateWay was called
    expect(result.statusCode).toBe(200);
    expect(ApiGatewayManagementApiClient).toHaveBeenCalled();
  });

  it('creates new room when targetUserId given and no match found', async () => {
    doccli.send
      .mockResolvedValueOnce({ Items: [] }) // user1 rooms
      .mockResolvedValueOnce({ Items: [] }) // user2 rooms
      .mockResolvedValue({});

    const event = {
      requestContext: {
        connectionId: 'conn1',
        authorizer: { sub: 'user1' },
        domainName: 'localhost',
        stage: 'dev',
      },
      body: JSON.stringify({ targetUserId: ['user2'] }),
    };

    const res = await handler(event);
    // Test passes when receiving success (200) and the mocked doccli.send (searches db for existing rooms) and ApiGateWay was called
    expect(res.statusCode).toBe(200);
    expect(doccli.send).toHaveBeenCalled();
    expect(ApiGatewayManagementApiClient).toHaveBeenCalled();
  });
});
