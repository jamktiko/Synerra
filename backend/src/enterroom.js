const { doccli } = require('./ddbconn.js');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

module.exports.handler = async (event) => {
  const connectionId = event.requestContext?.connectionId;
  if (!connectionId) {
    console.error('No connectionId found in requestContext', event);
    return { statusCode: 400, body: 'Missing connectionId' };
  }

  const roomId = JSON.parse(event.body).data;

  console.log('EnterRoom', connectionId, roomId);

  const params = {
    TableName: process.env.CONNECTION_DB_TABLE,
    Item: {
      roomId,
      connectionId,
    },
  };

  try {
    const data = await doccli.send(new PutCommand(params));
    console.log('Success, roomId and connectionId created!', data);
  } catch (err) {
    console.error('Error inserting item:', err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(''),
  };
};
