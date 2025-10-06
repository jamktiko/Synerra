const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn');

module.exports.handler = async (event) => {
  const userId = event.requestContext.authorizer?.jwt?.claims?.sub;

  try {
    const data = await doccli.send(
      new QueryCommand({
        TableName: process.env.MAIN_TABLE,
        IndexName: 'UnreadMessagesIndex',
        KeyConditionExpression: 'GSI1PK = :user',
        ExpressionAttributeValues: {
          ':user': `USER#${userId}`,
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  } catch (err) {
    console.error('Error fetching unread messages:', err);
    return { statusCode: 500, body: JSON.stringify('Internal server error') };
  }
};
