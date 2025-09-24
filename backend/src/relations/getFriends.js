const { doccli } = require('../ddbconn');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { sendResponse } = require('../helpers');

const MAIN_TABLE = process.env.MAIN_TABLE;

module.exports.handler = async (event) => {
  try {
    // Authenticated userId from JWT claims
    const authUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!authUserId) {
      return sendResponse(401, { message: 'Unauthorized' });
    }

    // Query DynamoDB for all FRIEND# items under this user
    const result = await doccli.send(
      new QueryCommand({
        TableName: MAIN_TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${authUserId}`,
          ':sk': 'FRIEND#',
        },
      })
    );

    // Extract friend userIds
    const friends = result.Items.map((item) => item.SK.replace('FRIEND#', ''));

    return sendResponse(200, {
      message: 'Friends retrieved successfully',
      count: friends.length,
      friends,
    });
  } catch (err) {
    console.error('Get friends error:', err);
    return sendResponse(500, {
      message: 'Failed to fetch friends',
      error: err.message,
    });
  }
};
