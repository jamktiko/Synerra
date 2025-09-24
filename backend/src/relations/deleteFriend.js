const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const MAIN_TABLE = process.env.MAIN_TABLE;

module.exports.handler = async (event) => {
  try {
    console.log('Full event:', JSON.stringify(event, null, 2));

    // Authenticated user (the one doing the removal) from the JWT claims
    const authUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!authUserId) {
      return sendResponse(401, { message: 'Unauthorized' });
    }

    // Get targetUserId from event body
    const body = JSON.parse(event.body || '{}');

    const { targetUserId } = body;

    if (!targetUserId) {
      return sendResponse(400, { message: 'targetUserId is required' });
    }

    // Check if friendship exists
    const existing = await doccli.send(
      new GetCommand({
        TableName: MAIN_TABLE,
        Key: { PK: `USER#${authUserId}`, SK: `FRIEND#${targetUserId}` },
      })
    );

    // If the friendship doesn't exist
    if (!existing.Item) {
      return sendResponse(404, {
        message: `No friendship found between ${authUserId} and ${targetUserId}`,
      });
    }

    // Delete both directions of the friendship
    await doccli.send(
      new DeleteCommand({
        TableName: MAIN_TABLE,
        Key: { PK: `USER#${authUserId}`, SK: `FRIEND#${targetUserId}` },
      })
    );

    await doccli.send(
      new DeleteCommand({
        TableName: MAIN_TABLE,
        Key: { PK: `USER#${targetUserId}`, SK: `FRIEND#${authUserId}` },
      })
    );

    // Success message
    return sendResponse(200, {
      message: `Friendship between ${authUserId} and ${targetUserId} deleted`,
    });
  } catch (err) {
    // Error handling
    console.error('Delete friend error:', err);
    return sendResponse(500, {
      message: 'Failed to delete friend',
      error: err.message,
    });
  }
};
