const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('./ddbconn');

module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const roomId = JSON.parse(event.body).data;

  console.log('ExitRoom', connectionId, roomId);

  const params = {
    TableName: process.env.CONNECTION_DB_TABLE,
    Key: {
      roomId,
      connectionId,
    },
  };

  try {
    const data = await doccli.send(new DeleteCommand(params));
    console.log('Success, connection deleted!', data);
  } catch (err) {
    console.error('Error deleting item:', err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(''),
  };
};
