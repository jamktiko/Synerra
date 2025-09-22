const { doccli } = require('../ddbconn');
const { sendResponse, verifyUser } = require('../helpers');
const { DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const MAIN_TABLE = process.env.MAIN_TABLE;

module.exports.handler = async (event) => {
  try {
    // Get authenticated user ID
    const authUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!authUserId) {
      return sendResponse(401, { message: 'Unauthorized' });
    }

    // Get gameId from path parameters
    const gameId = event.pathParameters?.gameId;
    if (!gameId) {
      return sendResponse(400, { message: 'gameId is required' });
    }

    // Delete the user-game relation
    const deleteParams = {
      TableName: MAIN_TABLE,
      Key: {
        PK: `USER#${authUserId}`, // Partition key = user
        SK: `GAME#${gameId}`, // Sort key = game
      },
      ReturnValues: 'ALL_OLD', //Returns the deleted values
    };

    // Sends the delete command to DynamoDb
    const deleteResult = await doccli.send(new DeleteCommand(deleteParams));

    // If no matching user-game relation is found
    if (!deleteResult.Attributes) {
      return sendResponse(404, { message: 'Relation not found' });
    }

    // Decrement the game's popularity (but don't go below 0)
    const updateParams = {
      TableName: MAIN_TABLE,
      Key: { PK: `GAME#${gameId}`, SK: 'DETAILS' },
      UpdateExpression:
        'SET Popularity = if_not_exists(Popularity, :zero) - :dec', // Decrement games popularity
      ExpressionAttributeValues: { ':dec': 1, ':zero': 0 },
      ConditionExpression: 'Popularity > :zero', // No popularity below 0
      ReturnValues: 'UPDATED_NEW',
    };

    let updatedPopularity = 0;
    try {
      // Update game's popularity
      const updateResult = await doccli.send(new UpdateCommand(updateParams));
      updatedPopularity = updateResult.Attributes.Popularity;
    } catch (err) {
      // Ignore if popularity was already 0
      if (err.name !== 'ConditionalCheckFailedException') {
        throw err;
      }
    }

    // Success message with relation info and updated game-popularity
    return sendResponse(200, {
      message: 'Relation removed successfully',
      relation: deleteResult.Attributes,
      popularity: updatedPopularity,
    });
  } catch (err) {
    // Error handler
    console.error('Delete relation error:', err);
    return sendResponse(500, {
      message: 'Failed to delete relation',
      error: err.message,
    });
  }
};
