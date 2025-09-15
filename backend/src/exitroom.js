const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('./ddbconn');

module.exports.handler = async (event) => {
  // Get the connection ID from the WebSocket request context
  const connectionId = event.requestContext.connectionId;
  //parse the event body from json
  const roomId = JSON.parse(event.body).data;

  // log the connectionid and roomid
  console.log('ExitRoom', connectionId, roomId);

  //params for ddb deletecommand
  const params = {
    //correct table from environmental variables
    TableName: process.env.CONNECTION_DB_TABLE,
    Key: {
      roomId,
      connectionId,
    },
  };

  try {
    //delete command that deletes the connection for connection table
    const data = await doccli.send(new DeleteCommand(params));
    console.log('Success, connection deleted!', data);
  } catch (err) {
    console.error('Error deleting item:', err);
  }

  //return statuscode 200 if connection deleted successfully
  return {
    statusCode: 200,
    body: JSON.stringify(''),
  };
};
