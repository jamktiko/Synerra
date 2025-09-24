const { doccli } = require('../ddbconn');
const { UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { sendResponse } = require('../helpers');

module.exports.handler = async (event) => {
  try {
    // Get the userId of the person giving the reputation from JWT Claims
    const fromUserId = event.requestContext.authorizer.jwt.claims.sub;

    // Parse the event body from JSON - contains targetUserId and reputationScore
    const { toUserId, score } = JSON.parse(event.body);

    //Validate input
    if (!toUserId || score == null || score < 0 || score > 100) {
      return sendResponse(400, { message: 'Invalid userId or score' }); // If the JSON doesnt have the correct values
    }

    // Gets current reputations and other user info of the target
    const result = await doccli.send(
      new GetCommand({
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `USER#${toUserId}`, SK: 'PROFILE' },
      })
    );

    // Get the user item and existing reputations (or initialize empty map)
    const userItem = result.Item || {};
    const reputations = userItem.Reputations || {};

    // Update reputation
    reputations[`USER#${fromUserId}`] = score; // This ensures only one rating per giver is stored; overwrites previous rating

    // Recalculate average reputation
    const scores = Object.values(reputations); // array of all reputation scores
    const count = scores.length; // total number of ratings
    const average = scores.reduce((a, b) => a + b, 0) / count; // average reputations

    // Save the updated reputations, average and count back to DynamoDb
    await doccli.send(
      new UpdateCommand({
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `USER#${toUserId}`, SK: 'PROFILE' },
        UpdateExpression:
          'SET Reputations = :r, AverageReputation = :avg, ReputationCount = :count',
        ExpressionAttributeValues: {
          ':r': reputations,
          ':avg': average,
          ':count': count,
        },
      })
    );
    // Success message
    return sendResponse(200, { average, count, reputations });
  } catch (err) {
    // Error handling
    console.error('Reputation error:', err);
    return sendResponse(500, {
      message: 'Failed to add reputation',
      error: err.message,
    });
  }
};
