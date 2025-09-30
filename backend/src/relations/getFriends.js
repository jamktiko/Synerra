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

    if (friends.length === 0) return sendResponse(200, { users: [] });

    // Fetch user data for each friend from GSI
    const usersData = [];
    for (const id of friends) {
      const userResult = await doccli.send(
        new QueryCommand({
          TableName: MAIN_TABLE,
          IndexName: 'UsernameIndex',
          KeyConditionExpression: 'GSI3PK = :pk AND SK = :sk',
          ExpressionAttributeValues: {
            ':pk': 'USER',
            ':sk': `USER#${id}`,
          },
        })
      );
      if (userResult.Items.length > 0) usersData.push(userResult.Items[0]);
    }

    return sendResponse(200, {
      message: 'Friends data retrieved',
      users: usersData,
    });
  } catch (err) {
    console.error('Get friends data error:', err);
    return sendResponse(500, {
      message: 'Failed to fetch friends data',
      error: err.message,
    });
  }
};
