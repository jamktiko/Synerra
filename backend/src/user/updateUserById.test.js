const { handler } = require('./updateUserById');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

describe('updateUser handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'TestTable';
  });

  test('updates allowed fields and returns updated attributes', async () => {
    const mockEvent = {
      body: JSON.stringify({
        username: 'NewName',
        bio: 'Hello world',
        languages: ['en', 'fi'],
      }),
      requestContext: {
        authorizer: { jwt: { claims: { sub: 'user-123' } } },
      },
    };

    const mockUpdatedAttributes = {
      PK: 'USER#user-123',
      SK: 'PROFILE',
      Username: 'NewName',
      Username_Lower: 'newname',
      Bio: 'Hello world',
      Languages: ['en', 'fi'],
    };

    doccli.send.mockResolvedValue({ Attributes: mockUpdatedAttributes });

    const res = await handler(mockEvent);

    expect(doccli.send).toHaveBeenCalledTimes(1);
    expect(doccli.send).toHaveBeenCalledWith(expect.any(UpdateCommand));

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockUpdatedAttributes);
  });

  test('returns 400 if no allowed fields are provided', async () => {
    const mockEvent = {
      body: JSON.stringify({ invalidField: 'test' }),
      requestContext: { authorizer: { jwt: { claims: { sub: 'user-123' } } } },
    };

    const res = await handler(mockEvent);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'No fields to update' });
  });

  test('returns 500 if DynamoDB update fails', async () => {
    const mockEvent = {
      body: JSON.stringify({ username: 'FailUser' }),
      requestContext: { authorizer: { jwt: { claims: { sub: 'user-123' } } } },
    };

    doccli.send.mockRejectedValue(new Error('Dynamo failure'));

    const res = await handler(mockEvent);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Failed to update user' });
  });

  test('automatically sets Username_Lower when username is updated', async () => {
    const mockEvent = {
      body: JSON.stringify({ username: 'UPPERCASE' }),
      requestContext: { authorizer: { jwt: { claims: { sub: 'user-123' } } } },
    };

    const mockAttrs = {
      PK: 'USER#user-123',
      SK: 'PROFILE',
      Username: 'UPPERCASE',
      Username_Lower: 'uppercase',
    };

    doccli.send.mockResolvedValue({ Attributes: mockAttrs });

    const res = await handler(mockEvent);

    expect(res.body.Username_Lower).toBe('uppercase');
  });
});
