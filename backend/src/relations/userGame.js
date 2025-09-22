const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const MAIN_TABLE = process.env.MAIN_TABLE;

module.exports.handler = async (event) => {
  try {
    console.log('Full event:', JSON.stringify(event, null, 2));
    console.log('Auth claims:', event.requestContext?.authorizer);
    // Get the authenticated userId from JWT claims
    const authUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!authUserId) {
      return sendResponse(401, { message: 'Unauthorized' });
    }

    // Parse body (expects gameId)
    const body = JSON.parse(event.body || '{}');
    const { gameId } = body;

    if (!gameId) {
      return sendResponse(400, { message: 'gameId is required' });
    }

    //Timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Relation item (user plays game)
    const item = {
      PK: `USER#${authUserId}`, // Partition-key = user
      SK: `GAME#${gameId}`, // Sort-key = game
      GSI1PK: `GAME#${gameId}`, // Secondary index to query by game
      GSI1SK: `USER#${authUserId}`, // Reverse lookup (users per game)
      Relation: 'PLAYS', // Relation type
      CreatedAt: timestamp, // When it was created
    };

    // Write relation to DynamoDB (no duplicates)
    await doccli.send(
      new PutCommand({
        TableName: MAIN_TABLE,
        Item: item,
        ConditionExpression:
          'attribute_not_exists(PK) AND attribute_not_exists(SK)', // avoid duplicates
      })
    );

    // Increment games popularity in the game item
    const popResult = await doccli.send(
      new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: { PK: `GAME#${gameId}`, SK: 'DETAILS' }, // Game "DETAILS" item
        UpdateExpression: 'ADD Popularity :inc', // Increment popularity
        ExpressionAttributeValues: { ':inc': 1 },
        ReturnValues: 'UPDATED_NEW', // Return the updated popularity value
      })
    );

    // Success response
    return sendResponse(201, {
      message: 'Game added to user successfully',
      relation: item,
      popularity: popResult.Attributes.Popularity,
    });
  } catch (err) {
    console.error('Add game error:', err);

    // If relation already exists
    if (err.name === 'ConditionalCheckFailedException') {
      return sendResponse(409, { message: 'Game already linked to user' });
    }

    // Generic failure message
    return sendResponse(500, {
      message: 'Failed to add game',
      error: err.message,
    });
  }
};
