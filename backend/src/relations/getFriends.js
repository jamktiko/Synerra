const { doccli } = require('../ddbconn');
const { QueryCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');
const { sendResponse } = require('../helpers');

const MAIN_TABLE = process.env.MAIN_TABLE;
const CONNECTION_TABLE = process.env.CONNECTION_DB_TABLE;

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

    if (friends.length === 0) {
      return sendResponse(200, { users: [] });
    }

    // BatchGet all friend user data in a single call
    const keys = friends.map((id) => ({
      PK: `USER#${id}`,
      SK: 'PROFILE',
    }));

    const batch = await doccli.send(
      new BatchGetCommand({
        RequestItems: {
          [MAIN_TABLE]: {
            Keys: keys,
          },
        },
      })
    );
    const users = batch.Responses[MAIN_TABLE] || [];
    // Check online status for each friend using notifications connection
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const userId = user.PK.replace('USER#', '');
        const connectionResult = await doccli.send(
          new QueryCommand({
            TableName: CONNECTION_TABLE,
            IndexName: 'UserIdIndex', // Query by UserIdIndex
            KeyConditionExpression: 'userId = :uid',
            FilterExpression: '#t = :typeVal',
            ExpressionAttributeNames: { '#t': 'type' },
            ExpressionAttributeValues: {
              ':uid': userId,
              ':typeVal': 'notifications',
            },
          })
        );

        //returns the online status for each user
        return {
          ...user,
          Status: connectionResult.Items?.length ? 'online' : 'offline',
        };
      })
    );
    return sendResponse(200, {
      message: 'Friends data retrieved',
      users: usersWithStatus,
    });
  } catch (err) {
    console.error('Get friends data error:', err);
    return sendResponse(500, {
      message: 'Failed to fetch friends data',
      error: err.message,
    });
  }
};
