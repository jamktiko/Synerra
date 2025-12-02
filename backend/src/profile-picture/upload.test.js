process.env.PFP_BUCKET = 'test-bucket';
process.env.MAIN_TABLE = 'main-table';
process.env.AWS_REGION = 'us-east-1';

const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');

// Mock DynamoDB client
jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

// Mock helpers
jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

// Mock S3 client
const mockS3Send = jest.fn();
jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: jest.fn(() => ({ send: mockS3Send })),
    PutObjectCommand: actual.PutObjectCommand,
  };
});

// Import handler after mocks and env vars
const { handler } = require('./upload');

describe('uploadProfilePicture handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    const event = { requestContext: { authorizer: {} }, body: '{}' };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(401, { message: 'Unauthorized' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 if file fields missing', async () => {
    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: '{}',
    };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'fileName, fileType, and fileContentBase64 are required',
    });
    expect(res.statusCode).toBe(400);
  });

  it('uploads profile picture successfully', async () => {
    mockS3Send.mockResolvedValueOnce({});
    doccli.send.mockResolvedValueOnce({});

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({
        fileName: 'pic.png',
        fileType: 'image/png',
        fileContentBase64: Buffer.from('fakeimage').toString('base64'),
      }),
    };

    const res = await handler(event);

    expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    expect(doccli.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
    expect(sendResponse).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        message: 'Profile picture uploaded successfully',
        url: expect.stringContaining(
          'https://test-bucket.s3.us-east-1.amazonaws.com/profile-pictures/user1/pic.png'
        ),
      })
    );
    expect(res.statusCode).toBe(200);
  });

  it('returns 500 on S3 error', async () => {
    mockS3Send.mockRejectedValueOnce(new Error('S3 error'));

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({
        fileName: 'pic.png',
        fileType: 'image/png',
        fileContentBase64: Buffer.from('fakeimage').toString('base64'),
      }),
    };

    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to upload profile picture',
      error: 'S3 error',
    });
    expect(res.statusCode).toBe(500);
  });

  it('returns 500 on DynamoDB error', async () => {
    mockS3Send.mockResolvedValueOnce({});
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({
        fileName: 'pic.png',
        fileType: 'image/png',
        fileContentBase64: Buffer.from('fakeimage').toString('base64'),
      }),
    };

    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to upload profile picture',
      error: 'DDB error',
    });
    expect(res.statusCode).toBe(500);
  });
});
