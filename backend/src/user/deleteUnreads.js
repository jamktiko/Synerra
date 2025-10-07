const { QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn');

module.exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
    const roomId = event.pathParameters.roomId;

    // 1. Fetch all unread messages in this room
    const unreadData = await doccli.send(
      new QueryCommand({
        TableName: process.env.MAIN_TABLE,
        IndexName: 'UnreadMessagesIndex', // your GSI for unread messages
        KeyConditionExpression:
          'GSI1PK = :userId AND begins_with(GSI1SK, :prefix)',
        ExpressionAttributeValues: {
          ':userId': `USER#${userId}`,
          ':prefix': 'UNREAD#',
        },
      })
    );

    // 2. Filter only messages from this room
    const unreadInRoom = unreadData.Items.filter(
      (item) => item.RoomId === roomId
    );

    // 3. Delete all unread messages in this room
    await Promise.all(
      unreadInRoom.map((msg) =>
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
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Error marking room messages as read:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
