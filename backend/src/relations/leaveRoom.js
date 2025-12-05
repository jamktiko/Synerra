const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const {
  DeleteCommand,
  GetCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const MAIN_TABLE = process.env.MAIN_TABLE;

module.exports.handler = async (event) => {
  try {
    console.log('Full event:', JSON.stringify(event, null, 2));

    const authUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!authUserId) {
      return sendResponse(401, { message: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { roomId } = body;

    if (!roomId) {
      return sendResponse(400, { message: 'roomId is required' });
    }

    const targetUserId = authUserId;

    const membershipPK = `CHAT#${roomId}#USER#${targetUserId}`;
    const membershipSK = `MEMBER#USER#${targetUserId}`;

    const existing = await doccli.send(
      new GetCommand({
        TableName: MAIN_TABLE,
        Key: { PK: membershipPK, SK: membershipSK },
      })
    );

    if (!existing.Item) {
      return sendResponse(404, {
        message: `User ${targetUserId} is not a member of room ${roomId}`,
      });
    }

    await doccli.send(
      new DeleteCommand({
        TableName: MAIN_TABLE,
        Key: { PK: membershipPK, SK: membershipSK },
      })
    );

    const metadataPK = `CHAT#${roomId}`; // <<< ADDED
    const metadataSK = `META#CHAT#${roomId}`; // <<< ADDED

    const meta = await doccli.send(
      // <<< ADDED
      new GetCommand({
        TableName: MAIN_TABLE,
        Key: { PK: metadataPK, SK: metadataSK },
      })
    );

    if (meta.Item) {
      // <<< ADDED
      const updatedUsers = (meta.Item.Users || []).filter(
        (u) => u !== targetUserId
      );

      await doccli.send(
        new UpdateCommand({
          TableName: MAIN_TABLE,
          Key: { PK: metadataPK, SK: metadataSK },
          UpdateExpression: 'SET #U = :u',
          ExpressionAttributeNames: {
            '#U': 'Users',
          },
          ExpressionAttributeValues: {
            ':u': updatedUsers,
          },
        })
      );
    }

    return sendResponse(200, {
      message: `User ${targetUserId} left room ${roomId}`,
    });
  } catch (err) {
    console.error('Delete member error:', err);
    return sendResponse(500, {
      message: 'Failed to leave room',
      error: err.message,
    });
  }
};
