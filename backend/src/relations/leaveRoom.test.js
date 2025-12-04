// leaveRoom.test.js
const { handler } = require('./leaveRoom');
const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const {
  GetCommand,
  DeleteCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((status, body) => ({ status, body })),
}));

describe('leaveRoom Lambda', () => {
  const authUserId = 'user-123';
  const roomId = 'room-456';
  const membershipPK = `CHAT#${roomId}#USER#${authUserId}`;
  const membershipSK = `MEMBER#USER#${authUserId}`;
  const metadataPK = `CHAT#${roomId}`;
  const metadataSK = `META#CHAT#${roomId}`;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'TestTable';
  });

  it('should return 401 if no authUserId', async () => {
    const event = {
      requestContext: { authorizer: { jwt: { claims: {} } } },
      body: '{}',
    };
    const res = await handler(event);
    expect(res.status).toBe(401);
    expect(sendResponse).toHaveBeenCalledWith(401, { message: 'Unauthorized' });
  });

  it('should return 400 if no roomId', async () => {
    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: authUserId } } } },
      body: '{}',
    };
    const res = await handler(event);
    expect(res.status).toBe(400);
    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'roomId is required',
    });
  });

  it('should return 404 if membership does not exist', async () => {
    doccli.send.mockResolvedValueOnce({}); // GetCommand returns no item
    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: authUserId } } } },
      body: JSON.stringify({ roomId }),
    };
    const res = await handler(event);
    expect(res.status).toBe(404);
    expect(sendResponse).toHaveBeenCalledWith(404, {
      message: `User ${authUserId} is not a member of room ${roomId}`,
    });
  });

  it('should delete membership and update metadata', async () => {
    // Mock existing membership
    doccli.send
      .mockResolvedValueOnce({ Item: { PK: membershipPK, SK: membershipSK } }) // Get membership
      .mockResolvedValueOnce({}) // Delete membership
      .mockResolvedValueOnce({ Item: { Users: [authUserId, 'otherUser'] } }) // Get metadata
      .mockResolvedValueOnce({}); // Update metadata

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: authUserId } } } },
      body: JSON.stringify({ roomId }),
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledTimes(4);
    // Get membership
    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    // Delete membership
    expect(doccli.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
    // Get metadata
    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    // Update metadata
    expect(doccli.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Key: { PK: metadataPK, SK: metadataSK },
          UpdateExpression: 'SET #U = :u',
          ExpressionAttributeValues: { ':u': ['otherUser'] },
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(`User ${authUserId} left room ${roomId}`);
  });

  it('should handle errors gracefully', async () => {
    doccli.send.mockRejectedValueOnce(new Error('Dynamo error'));
    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: authUserId } } } },
      body: JSON.stringify({ roomId }),
    };
    const res = await handler(event);
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Failed to leave room');
    expect(res.body.error).toBe('Dynamo error');
  });
});
