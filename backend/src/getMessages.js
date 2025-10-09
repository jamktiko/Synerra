// getMessagesHandler.js
const { doccli } = require('./ddbconn');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');

module.exports.handler = async (event) => {
  console.log('GetMessages triggered');

  // Extract roomId from query parameters
  const roomId = event.pathParameters?.roomId;
  if (!roomId) {
    console.warn('Missing roomId');
    return { statusCode: 400, body: JSON.stringify('Missing roomId') };
  }

  console.log('Fetching messages for roomId:', roomId);

  try {
    const queryParams = {
      TableName: process.env.MAIN_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': `room#${roomId}`,
        ':prefix': 'message#',
      },
      ScanIndexForward: true, // true = oldest first, false = newest first
    };

    const data = await doccli.send(new QueryCommand(queryParams));
    //11
    console.log(`Found ${data.Items.length} messages`);
    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  } catch (err) {
    console.error('Error fetching messages:', err);
    return { statusCode: 500, body: JSON.stringify('Internal server error') };
  }
};
