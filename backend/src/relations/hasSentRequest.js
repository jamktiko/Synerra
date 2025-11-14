const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');

const MAIN_TABLE = process.env.MAIN_TABLE;

module.exports.handler = async (event) => {
  try {
    const authUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!authUserId) return sendResponse(401, { message: 'Unauthorized' });

    // Query all friend requests sent by the authenticated user
    const result = await doccli.send(
      new QueryCommand({
        TableName: MAIN_TABLE,
        KeyConditionExpression: 'PK = :sender AND begins_with(SK, :prefix)',
        ExpressionAttributeValues: {
          ':sender': `USER#${authUserId}`,
          ':prefix': 'FRIEND_REQUEST#',
        },
      })
    );

    // Filter only pending requests
    const pendingRequests =
      result.Items?.filter((item) => item.Status === 'PENDING') || [];

    return sendResponse(200, { pendingRequests });
  } catch (err) {
    console.error('Get outgoing pending friend requests error:', err);
    return sendResponse(500, {
      message: 'Failed to retrieve outgoing pending friend requests',
      error: err.message,
    });
  }
};
