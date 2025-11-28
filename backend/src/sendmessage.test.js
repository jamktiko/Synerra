// sendmessage.test.js
const { doccli } = require('./ddbconn');

// Mock AWS SDK ApiGatewayManagementApi
let mockPostToConnection = jest.fn();
jest.mock('@aws-sdk/client-apigatewaymanagementapi', () => {
  return {
    ApiGatewayManagementApi: jest.fn(() => ({
      send: mockPostToConnection,
    })),
    PostToConnectionCommand: jest.fn(),
  };
});

// Leave out notifications so they don't consume DynamoDB mocks
jest.mock('./notifications/notifSend', () => ({
  handler: jest.fn().mockResolvedValue({}),
}));

// Import handler after mocks
const { handler } = require('./sendmessage');

describe('sendMessage Lambda', () => {
  beforeEach(() => {
    mockPostToConnection.mockReset();
    mockPostToConnection.mockResolvedValue({});

    doccli.send = jest
      .fn()
      // 1. Query by connectionId
      .mockResolvedValueOnce({
        Items: [{ roomId: 'room1', connectionId: 'conn1' }],
      })
      // 2. Put message
      .mockResolvedValueOnce({})
      // 3. Query room members
      .mockResolvedValueOnce({ Items: [{ UserId: 'user2' }] })
      // 4. Put unread marker
      .mockResolvedValueOnce({})
      // 5. Query active connections
      .mockResolvedValueOnce({ Items: [{ userId: 'user1' }] })
      // 6. Query all connections in room
      .mockResolvedValueOnce({
        Items: [{ connectionId: 'conn1', roomId: 'room1' }],
      })
      // 7. Delete stale connection (if triggered)
      .mockResolvedValueOnce({})
      // Default for any extra calls
      .mockResolvedValue({});
  });

  it('sends message successfully', async () => {
    const mockEvent = {
      requestContext: {
        connectionId: 'conn1',
        authorizer: { sub: 'user1' },
        domainName: 'test-domain',
        stage: 'dev',
      },
      body: JSON.stringify({
        data: {
          SenderId: 'user1',
          RoomId: 'room1',
          Content: 'Hello',
          Timestamp: 'ts1',
          SenderUsername: 'Alice',
          ProfilePicture: 'pic-url',
        },
      }),
    };

    const res = await handler(mockEvent);

    expect(mockPostToConnection).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toBe('Message sent');
  });
});
