const { QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn');

module.exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Missing userId' }),
      };
    }

    // 1. Fetch all unread messages for this user
    const unreadData = await doccli.send(
      new QueryCommand({
        TableName: process.env.MAIN_TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':prefix': 'UNREAD#',
        },
      })
    );

    const allUnreads = unreadData.Items;

    if (!allUnreads || allUnreads.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, deleted: 0 }),
      };
    }

    // 2. Delete all unread messages for this user
    await Promise.all(
      allUnreads.map((msg) =>
        doccli.send(
          new DeleteCommand({
            TableName: process.env.MAIN_TABLE,
            Key: {
              PK: msg.PK,
              SK: msg.SK,
            },
          })
        )
      )
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, deleted: allUnreads.length }),
    };
  } catch (err) {
    console.error('Error clearing all unreads for user:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
