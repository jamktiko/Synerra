// exitroom.test.js
const { handler } = require('./exitroom');
const { doccli } = require('./ddbconn');
const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// Mock the doccli send method
jest.mock('./ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

// Mock DeleteCommand from AWS SDK
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DeleteCommand: jest.fn((params) => params),
}));

describe('exitRoom Lambda', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    process.env.CONNECTION_DB_TABLE = 'ConnTable';
  });

  it('should delete a connection and return 200', async () => {
    //  create a mock event
    const event = {
      requestContext: { connectionId: 'conn123' },
      body: JSON.stringify({ data: 'room1' }),
    };

    // Mock the doccli.send to resolve successfully
    doccli.send.mockResolvedValueOnce({});

    //  call the Lambda handler
    const result = await handler(event);

    //  handler returns 200
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(''));

    // DeleteCommand was called with correct parameters
    expect(DeleteCommand).toHaveBeenCalledWith({
      TableName: 'ConnTable',
      Key: { roomId: 'room1', connectionId: 'conn123' },
    });

    // doccli.send was called
    expect(doccli.send).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const event = {
      requestContext: { connectionId: 'conn123' },
      body: JSON.stringify({ data: 'room1' }),
    };

    // Simulate an error in doccli.send
    doccli.send.mockRejectedValueOnce(new Error('Dynamo error'));

    const result = await handler(event);

    // Even on error, Lambda returns 200
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(''));

    // DeleteCommand still should be called
    expect(DeleteCommand).toHaveBeenCalledWith({
      TableName: 'ConnTable',
      Key: { roomId: 'room1', connectionId: 'conn123' },
    });

    expect(doccli.send).toHaveBeenCalled();
  });
});
