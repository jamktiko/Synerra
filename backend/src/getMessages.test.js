// getMessagesHandler.test.js
const { handler } = require('./getMessages');
const { doccli } = require('./ddbconn');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Mock the doccli send method
jest.mock('./ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

// Mock QueryCommand from AWS SDK
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  QueryCommand: jest.fn((params) => params),
}));

describe('getMessagesHandler Lambda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'MainTable';
  });

  it('should return 400 if roomId is missing', async () => {
    const event = { pathParameters: {} };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(JSON.stringify('Missing roomId'));

    // Ensure QueryCommand is never called
    expect(QueryCommand).not.toHaveBeenCalled();
    expect(doccli.send).not.toHaveBeenCalled();
  });

  it('should fetch messages and return 200', async () => {
    const event = { pathParameters: { roomId: 'room123' } };

    const mockMessages = [
      { PK: 'room#room123', SK: 'message#1', content: 'Hello' },
      { PK: 'room#room123', SK: 'message#2', content: 'World' },
    ];

    // Mock doccli.send to return messages
    doccli.send.mockResolvedValueOnce({ Items: mockMessages });

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(mockMessages);

    // Ensure QueryCommand is called with correct params
    expect(QueryCommand).toHaveBeenCalledWith({
      TableName: 'MainTable',
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': 'room#room123',
        ':prefix': 'message#',
      },
      ScanIndexForward: true,
    });

    // Ensure doccli.send is called
    expect(doccli.send).toHaveBeenCalled();
  });

  it('should return 500 if DynamoDB query fails', async () => {
    const event = { pathParameters: { roomId: 'room123' } };

    doccli.send.mockRejectedValueOnce(new Error('Dynamo error'));

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe(JSON.stringify('Internal server error'));

    expect(QueryCommand).toHaveBeenCalled();
    expect(doccli.send).toHaveBeenCalled();
  });
});
