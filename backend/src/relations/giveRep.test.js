const { handler } = require('./giveRep');
const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('../ddbconn', () => ({
  doccli: { send: jest.fn() },
}));

jest.mock('../helpers', () => ({
  sendResponse: jest.fn((statusCode, body) => ({ statusCode, body })),
}));

describe('addReputation handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if input is invalid', async () => {
    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({
        toUserId: '',
        mentality: 200,
        comms: 50,
        teamwork: 50,
      }),
    };
    const res = await handler(event);
    expect(sendResponse).toHaveBeenCalledWith(400, {
      message: 'Invalid input',
    });
    expect(res.statusCode).toBe(400);
  });

  it('adds reputation when no existing reputations', async () => {
    doccli.send
      .mockResolvedValueOnce({ Item: {} }) // GetCommand returns empty user
      .mockResolvedValueOnce({}); // UpdateCommand

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({
        toUserId: 'user2',
        mentality: 80,
        comms: 70,
        teamwork: 90,
      }),
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(doccli.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
    expect(sendResponse).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        AverageMentality: 80,
        AverageComms: 70,
        AverageTeamwork: 90,
        MainReputation: (80 + 70 + 90) / 3,
        ReputationCount: 1,
      })
    );
    expect(res.statusCode).toBe(200);
  });

  it('adds reputation when existing reputations present', async () => {
    const existingReps = {
      'USER#other': { mentality: 50, comms: 60, teamwork: 70 },
    };
    doccli.send
      .mockResolvedValueOnce({ Item: { Reputations: existingReps } }) // GetCommand
      .mockResolvedValueOnce({}); // UpdateCommand

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({
        toUserId: 'user2',
        mentality: 80,
        comms: 70,
        teamwork: 90,
      }),
    };

    const res = await handler(event);

    expect(doccli.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(doccli.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
    const body = res.body;
    expect(body.ReputationCount).toBe(2);
    expect(body.Reputations['USER#user1']).toEqual({
      mentality: 80,
      comms: 70,
      teamwork: 90,
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 500 on DynamoDB error', async () => {
    doccli.send.mockRejectedValueOnce(new Error('DDB error'));

    const event = {
      requestContext: { authorizer: { jwt: { claims: { sub: 'user1' } } } },
      body: JSON.stringify({
        toUserId: 'user2',
        mentality: 80,
        comms: 70,
        teamwork: 90,
      }),
    };

    const res = await handler(event);

    expect(sendResponse).toHaveBeenCalledWith(500, {
      message: 'Failed to add reputation',
      error: 'DDB error',
    });
    expect(res.statusCode).toBe(500);
  });
});
