const { handler } = require('./me');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { sendResponse } = require('../helpers');
const { doccli } = require('../ddbconn');

jest.mock('../helpers', () => ({
  sendResponse: jest.fn(),
}));

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

describe('/me handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIN_TABLE = 'TestTable';
  });

  test('returns 401 when no userId found', async () => {
    const event = {
      requestContext: {
        authorizer: {
          jwt: { claims: {} },
        },
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).message).toBe(
      'Unauthorized: no user ID found'
    );
  });

  test('returns 404 when user not found', async () => {
    doccli.send.mockResolvedValue({ Item: undefined });
    sendResponse.mockReturnValue({
      statusCode: 404,
      body: JSON.stringify({ message: 'User not found' }),
    });

    const event = {
      requestContext: {
        authorizer: {
          jwt: { claims: { sub: 'abc123' } },
        },
      },
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(sendResponse).toHaveBeenCalledWith(404, {
      message: 'User not found',
    });
    expect(res.statusCode).toBe(404);
  });

  test('returns 200 with user data', async () => {
    const fakeUser = {
      PK: 'USER#abc123',
      SK: 'PROFILE',
      Username: 'John',
    };

    doccli.send.mockResolvedValue({ Item: fakeUser });
    sendResponse.mockReturnValue({
      statusCode: 200,
      body: JSON.stringify(fakeUser),
    });

    const event = {
      requestContext: {
        authorizer: {
          jwt: { claims: { sub: 'abc123' } },
        },
      },
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(sendResponse).toHaveBeenCalledWith(200, fakeUser);
    expect(res.statusCode).toBe(200);
  });
});
