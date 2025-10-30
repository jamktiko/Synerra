const { doccli } = require('../ddbconn');
const { sendResponse, verifyUser } = require('../helpers');
const {
  DeleteCommand,
  UpdateCommand,
  GetCommand,
} = require('@aws-sdk/lib-dynamodb');

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
        PK: `USER#${authUserId}`,
        SK: `GAME#${gameId}`,
      },
      ReturnValues: 'ALL_OLD',
    };

    const deleteResult = await doccli.send(new DeleteCommand(deleteParams));

    // Fetch user's profile
    const profileGet = await doccli.send(
      new GetCommand({
        TableName: MAIN_TABLE,
        Key: { PK: `USER#${authUserId}`, SK: 'PROFILE' },
      })
    );

    let hadRelationOrPlayed = false;

    // Check if user had PlayedGames and remove it if found
    if (profileGet.Item?.PlayedGames?.length) {
      const gameIndex = profileGet.Item.PlayedGames.findIndex(
        (g) => g.gameId === gameId
      );

      if (gameIndex >= 0) {
        hadRelationOrPlayed = true;

        const updateProfileParams = {
          TableName: MAIN_TABLE,
          Key: { PK: `USER#${authUserId}`, SK: 'PROFILE' },
          UpdateExpression: `REMOVE PlayedGames[${gameIndex}]`,
          ReturnValues: 'UPDATED_NEW',
        };

        await doccli.send(new UpdateCommand(updateProfileParams));
      }
    }

    // ✅ Only decrement popularity if relation existed OR the game was in PlayedGames
    if (deleteResult.Attributes || hadRelationOrPlayed) {
      const updateParams = {
        TableName: MAIN_TABLE,
        Key: { PK: `GAME#${gameId}`, SK: 'DETAILS' },
        UpdateExpression:
          'SET Popularity = if_not_exists(Popularity, :zero) - :dec',
        ExpressionAttributeValues: { ':dec': 1, ':zero': 0 },
        ConditionExpression: 'Popularity > :zero',
        ReturnValues: 'UPDATED_NEW',
      };

      try {
        const updateResult = await doccli.send(new UpdateCommand(updateParams));
        updatedPopularity = updateResult.Attributes.Popularity;
      } catch (err) {
        if (err.name !== 'ConditionalCheckFailedException') {
          throw err;
        }
      }
    }

    return sendResponse(200, {
      message: 'Relation removed successfully',
      relation: deleteResult.Attributes || null,
    });
  } catch (err) {
    console.error('Delete relation error:', err);
    return sendResponse(500, {
      message: 'Failed to delete relation',
      error: err.message,
    });
  }
};
