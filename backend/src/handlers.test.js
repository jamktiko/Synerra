// handlers.test.js
const { doccli } = require('./ddbconn');

// Mock AWS SDK ApiGatewayManagementApi
let mockSendToConnection = jest.fn();
jest.mock('@aws-sdk/client-apigatewaymanagementapi', () => {
  return {
    ApiGatewayManagementApi: jest.fn(() => ({
      send: mockSendToConnection,
    })),
    PostToConnectionCommand: jest.fn(),
  };
});

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));
const jwt = require('jsonwebtoken');

// Import handlers after mocks
const {
  connectHandler,
  disconnectHandler,
  defaultHandler,
  authorize,
  auth,
} = require('./handlers');

describe('WebSocket Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendToConnection.mockResolvedValue({});
    doccli.send = jest.fn();
  });

  describe('connectHandler', () => {
    it('rejects if no token provided', async () => {
      const event = {
        headers: {},
        queryStringParameters: {},
        requestContext: {},
      };
      const res = await connectHandler(event);
      expect(res.statusCode).toBe(401);
      expect(res.body).toBe('Unauthorized');
    });

    it('saves notification connection when token valid', async () => {
      jwt.verify.mockImplementation((token, getKey, opts, cb) =>
        cb(null, { sub: 'user1', email: 'test@example.com' })
      );

      doccli.send
        .mockResolvedValueOnce({}) // PutCommand for saving connection
        .mockResolvedValueOnce({ Items: [] }); // QueryCommand in broadcastUserStatus

      const event = {
        headers: { Authorization: 'Bearer validtoken' },
        queryStringParameters: { type: 'notifications' },
        requestContext: {
          connectionId: 'abc',
          domainName: 'domain',
          stage: 'dev',
        },
      };

      const res = await connectHandler(event);
      expect(doccli.send).toHaveBeenCalledTimes(2);
      expect(res).toEqual({});
    });
  });

  describe('disconnectHandler', () => {
    it('removes connection and broadcasts offline', async () => {
      doccli.send
        .mockResolvedValueOnce({
          Items: [
            {
              roomId: 'room1',
              connectionId: 'abc',
              userId: 'user1',
              type: 'notifications',
            },
          ],
        }) // QueryCommand
        .mockResolvedValueOnce({}) // DeleteCommand
        .mockResolvedValueOnce({ Items: [] }); // broadcastUserStatus query

      const event = {
        requestContext: {
          connectionId: 'abc',
          domainName: 'domain',
          stage: 'dev',
        },
      };

      const res = await disconnectHandler(event);
      expect(doccli.send).toHaveBeenCalledTimes(3);
      expect(res.statusCode).toBe(200);
      expect(res.body).toBe('Disconnected');
    });
  });

  describe('defaultHandler', () => {
    it('returns 404 failedResponse', async () => {
      const res = await defaultHandler();
      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.body)).toBe('No event found');
    });
  });

  describe('authorize', () => {
    it('returns decoded user when JWT valid', async () => {
      jwt.verify.mockImplementation((token, getKey, opts, cb) =>
        cb(null, { sub: 'user1', email: 'test@example.com' })
      );
      const user = await authorize('validtoken');
      expect(user.sub).toBe('user1');
    });

    it('returns null when JWT invalid', async () => {
      jwt.verify.mockImplementation((token, getKey, opts, cb) =>
        cb(new Error('invalid'), null)
      );
      const user = await authorize('badtoken').catch(() => null);
      expect(user).toBeNull();
    });
  });

  describe('auth', () => {
    it('returns IAM policy when authorized', async () => {
      jwt.verify.mockImplementation((token, getKey, opts, cb) =>
        cb(null, { sub: 'user1', email: 'test@example.com' })
      );
      const event = {
        queryStringParameters: { Auth: 'validtoken' },
        methodArn: 'arn:aws:execute',
      };
      const res = await auth(event);
      expect(res.principalId).toBe('user1');
      expect(res.policyDocument.Statement[0].Effect).toBe('Allow');
      expect(res.context.username).toBe('test@example.com');
    });
  });
});
