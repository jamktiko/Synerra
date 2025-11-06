const { doccli } = require('../ddbconn');
const { UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { sendResponse } = require('../helpers');

module.exports.handler = async (event) => {
  try {
    const fromUserId = event.requestContext.authorizer.jwt.claims.sub; // get user id from jwt claims

    const { toUserId, mentality, comms, teamwork } = JSON.parse(event.body); // data from event body

    // make sure the they are numbers
    const mentalityNum = Number(mentality);
    const commsNum = Number(comms);
    const teamworkNum = Number(teamwork);

    // Validate input
    if (
      !toUserId ||
      Number.isNaN(mentalityNum) ||
      mentalityNum < 0 ||
      mentalityNum > 100 ||
      Number.isNaN(commsNum) ||
      commsNum < 0 ||
      commsNum > 100 ||
      Number.isNaN(teamworkNum) ||
      teamworkNum < 0 ||
      teamworkNum > 100
    ) {
      return sendResponse(400, { message: 'Invalid input' });
    }

    // Get the user we are going to send the rep to
    const result = await doccli.send(
      new GetCommand({
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `USER#${toUserId}`, SK: 'PROFILE' },
      })
    );

    const userItem = result.Item || {};
    const reputations = userItem.Reputations || {};

    console.log('User: ', userItem, 'Reputations: ', reputations);

    // Store/update this giver's rating entry
    reputations[`USER#${fromUserId}`] = {
      mentality: mentalityNum,
      comms: commsNum,
      teamwork: teamworkNum,
    };

    // Recalculate averages
    const values = Object.values(reputations);
    const count = values.length;

    let avgMentality = 0;
    let avgComms = 0;
    let avgTeamwork = 0;
    let mainReputation = 0;

    // If there is at least one rating, calculate new averages
    if (count > 0) {
      const sumMentality = values.reduce((sum, r) => sum + r.mentality, 0);
      const sumComms = values.reduce((sum, r) => sum + r.comms, 0);
      const sumTeamwork = values.reduce((sum, r) => sum + r.teamwork, 0);

      avgMentality = sumMentality / count;
      avgComms = sumComms / count;
      avgTeamwork = sumTeamwork / count;

      // Main reputation is average of the three category averages
      mainReputation = (avgMentality + avgComms + avgTeamwork) / 3;
    }

    // Update database with new reputation data and summary fields
    await doccli.send(
      new UpdateCommand({
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `USER#${toUserId}`, SK: 'PROFILE' },
        UpdateExpression:
          'SET Reputations = :r, AverageMentality = :am, AverageComms = :ac, AverageTeamwork = :at, MainReputation = :mr, ReputationCount = :count',
        ExpressionAttributeValues: {
          ':r': reputations,
          ':am': avgMentality,
          ':ac': avgComms,
          ':at': avgTeamwork,
          ':mr': mainReputation,
          ':count': count,
        },
      })
    );

    // send response
    return sendResponse(200, {
      AverageMentality: avgMentality,
      AverageComms: avgComms,
      AverageTeamwork: avgTeamwork,
      MainReputation: mainReputation,
      ReputationCount: count,
      Reputations: reputations,
    });
  } catch (err) {
    console.error('Reputation error:', err);
    return sendResponse(500, {
      message: 'Failed to add reputation',
      error: err.message,
    });
  }
};
