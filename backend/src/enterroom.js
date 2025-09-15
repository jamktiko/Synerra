const { doccli } = require('./ddbconn.js');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

module.exports.handler = async (event) => {
  // Get the connection ID from the WebSocket request context
  const connectionId = event.requestContext?.connectionId;
  if (!connectionId) {
    console.error('No connectionId found in requestContext', event);
    return { statusCode: 400, body: 'Missing connectionId' };
  }
  //parse the event body from json
  const roomId = JSON.parse(event.body).data;

  // console log the connection id and roomid
  console.log('EnterRoom', connectionId, roomId);

  //params for ddb put command
  const params = {
    // correct table from environmental variables
    TableName: process.env.CONNECTION_DB_TABLE,
    Item: {
      roomId,
      connectionId,
    },
  };

  try {
    //insert the item to ddb
    const data = await doccli.send(new PutCommand(params));
    console.log('Success, roomId and connectionId created!', data); // Log success
  } catch (err) {
    // error logs
    console.error('Error inserting item:', err);
  }

  //return 200 if the connection is ok
  return {
    statusCode: 200,
    body: JSON.stringify(''),
  };
};
