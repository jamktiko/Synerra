// src/games/addGame.test.js
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn');
const { sendResponse, verifyAdmin } = require('../helpers');
const { v4: uuidv4 } = require('uuid');

// Mock DynamoDB client
jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
  ddbclient: {},
}));

// Mock helpers
jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
  verifyAdmin: jest.fn(),
  validateInput: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({ v4: jest.fn() }));

// ✅ Secrets Manager mock: define send inside factory and expose it
jest.mock('@aws-sdk/client-secrets-manager', () => {
  const sendMock = jest.fn();
  return {
    SecretsManagerClient: jest.fn(() => ({ send: sendMock })),
    GetSecretValueCommand: jest.fn(),
    __sendMock: sendMock, // expose for tests
  };
});

// Import handler after mocks
const { handler } = require('./addGame');
const {
  __sendMock: secretsSendMock,
} = require('@aws-sdk/client-secrets-manager');

describe('addGame handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'main-table';
    process.env.SECRET_NAME = 'secret-name';

    // ✅ Ensure Secrets Manager always returns a valid SecretString
    secretsSendMock.mockResolvedValue({
      SecretString: JSON.stringify({
        API_CLIENT_ID: 'client123',
        API_BEARER_TOKEN: 'token123',
      }),
    });

    uuidv4.mockReturnValue('game-uuid');
    global.fetch = jest.fn();
  });

  it('returns 403 if not admin', async () => {
    verifyAdmin.mockReturnValue({ isAdmin: false, userId: 'user1' });

    const event = {
      body: JSON.stringify({
        name: 'Chess',
        genre: 'Board',
        img_name: 'chess',
      }),
    };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(403, {
      message: 'Admin privileges required',
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 if malformed JSON body', async () => {
    verifyAdmin.mockReturnValue({ isAdmin: true, userId: 'admin1' });

    const event = { body: '{badjson' };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'Malformed JSON in request body',
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 if missing required fields', async () => {
    verifyAdmin.mockReturnValue({ isAdmin: true, userId: 'admin1' });

    const event = { body: JSON.stringify({ name: 'Chess' }) };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'Missing required game fields',
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 502 if image API fails', async () => {
    verifyAdmin.mockReturnValue({ isAdmin: true, userId: 'admin1' });
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const event = {
      body: JSON.stringify({
        name: 'Chess',
        genre: 'Board',
        img_name: 'chess',
      }),
    };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(502, {
      message: 'Failed to fetch image URL',
    });
    expect(res.statusCode).toBe(502);
  });

  it('returns 404 if image API returns no data', async () => {
    verifyAdmin.mockReturnValue({ isAdmin: true, userId: 'admin1' });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const event = {
      body: JSON.stringify({
        name: 'Chess',
        genre: 'Board',
        img_name: 'chess',
      }),
    };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(404, {
      message: 'Image URL not found for this game',
    });
    expect(res.statusCode).toBe(404);
  });

  it('adds game successfully', async () => {
    verifyAdmin.mockReturnValue({ isAdmin: true, userId: 'admin1' });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { box_art_url: 'http://example.com/{width}x{height}/cover.png' },
        ],
      }),
    });
    doccli.send.mockResolvedValueOnce({});

    const event = {
      body: JSON.stringify({
        name: 'Chess',
        genre: 'Board',
        img_name: 'chess',
      }),
    };
    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(PutCommand));
    expect(sendResponse).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        message: 'Game added successfully',
        game: expect.objectContaining({
          PK: 'GAME#game-uuid',
          Name: 'Chess',
          Genre: 'Board',
          Img_url: 'http://example.com/600x800/cover.png',
        }),
      })
    );
    expect(res.statusCode).toBe(200);
  });

  it('returns 500 on DynamoDB error', async () => {
    verifyAdmin.mockReturnValue({ isAdmin: true, userId: 'admin1' });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { box_art_url: 'http://example.com/{width}x{height}/cover.png' },
        ],
      }),
    });
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = {
      body: JSON.stringify({
        name: 'Chess',
        genre: 'Board',
        img_name: 'chess',
      }),
    };
    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to add game',
      error: 'DDB error',
    });
    expect(res.statusCode).toBe(500);
  });
});
