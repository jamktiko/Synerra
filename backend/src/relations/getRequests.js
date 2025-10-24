const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');

const MAIN_TABLE = process.env.MAIN_TABLE;

module.exports.handler = async (event) => {
  try {
    const authUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!authUserId) return sendResponse(401, { message: 'Unauthorized' });

    const result = await doccli.send(
      new QueryCommand({
        TableName: MAIN_TABLE,
        IndexName: 'OnlineStatusIndex', // replace with your actual GSI for friend requests
        KeyConditionExpression:
          'GSI1PK = :userId AND begins_with(GSI1SK, :prefix)',
        ExpressionAttributeValues: {
          ':userId': `USER#${authUserId}`,
          ':prefix': 'FRIEND_REQUEST#',
        },
      })
    );

    const pendingRequests = result.Items || [];
    console.log(pendingRequests);

    return sendResponse(200, {
      message: 'Pending friend requests retrieved successfully',
      pendingRequests,
    });
  } catch (err) {
    console.error('Get pending friend requests error:', err);
    return sendResponse(500, {
      message: 'Failed to retrieve pending friend requests',
      error: err.message,
    });
  }
};
