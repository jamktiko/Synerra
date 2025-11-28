jest.mock('@aws-sdk/lib-dynamodb', () => ({
  QueryCommand: jest.fn().mockImplementation((params) => params),
}));

jest.mock('../ddbconn', () => ({
  doccli: {
    send: jest.fn(),
  },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((status, body) => ({
    statusCode: status,
    body: JSON.stringify(body),
  })),
}));

const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const handler = require('./getUsers').handler;

describe('listUsers Lambda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'MainTable';
    process.env.CONNECTION_DB_TABLE = 'Connections';
  });

  test('returns users with correct structure and online/offline status', async () => {
    // return users (SK = PROFILE)
    doccli.send.mockResolvedValueOnce({
      Items: [
        {
          PK: 'USER#d0dce97c-1011-7015-aac1-d53ee82199b5',
          SK: 'PROFILE',
          Email: 'test@example.com',
          Username: 'TestUser',
          Username_Lower: 'testuser',
          GSI3PK: 'USER',
          Birthday: '2025-10-20T00:00:00.000Z',
          CreatedAt: 1763653019,
          UserId: 'd0dce97c-1011-7015-aac1-d53ee82199b5',
        },
      ],
    });

    // online status (user online)
    doccli.send.mockResolvedValueOnce({
      Items: [
        {
          connectionId: 'abcdef',
          userId: 'd0dce97c-1011-7015-aac1-d53ee82199b5',
          type: 'notifications',
        },
      ],
    });

    const response = await handler({});

    expect(doccli.send).toHaveBeenCalledTimes(2);

    expect(sendResponse).toHaveBeenCalledWith(200, {
      users: [
        {
          PK: 'USER#d0dce97c-1011-7015-aac1-d53ee82199b5',
          SK: 'PROFILE',
          Email: 'test@example.com',
          Username: 'TestUser',
          Username_Lower: 'testuser',
          GSI3PK: 'USER',
          Birthday: '2025-10-20T00:00:00.000Z',
          CreatedAt: 1763653019,
          UserId: 'd0dce97c-1011-7015-aac1-d53ee82199b5',
          Status: 'online',
        },
      ],
    });

    expect(response.statusCode).toBe(200);
  });

  test('handles DynamoDB error', async () => {
    doccli.send.mockRejectedValue(new Error('DynamoDB exploded'));

    const response = await handler({});

    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to fetch users',
      error: 'DynamoDB exploded',
    });

    expect(response.statusCode).toBe(500);
  });
});
