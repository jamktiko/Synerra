const {
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  PutCommand,
} = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('./ddbconn');
const {
  ApiGatewayManagementApi,
  PostToConnectionCommand,
} = require('@aws-sdk/client-apigatewaymanagementapi');

//handler for sendmessage-route
module.exports.handler = async (event) => {
  console.log('SendMessage triggered');
  //extract websocket connection id from from request
  const connectionId = event.requestContext.connectionId;
  const userId = event.requestContext.authorizer?.sub;

  //extract message payload from client request body
  let { senderId, roomId, message, timestamp, senderUsername } = JSON.parse(
    event.body
  ).data;

  // find roomId for this connection first

  try {
    //paremeters for the scan
    const scanParams = {
      //get the correct table with environmental variables
      TableName: process.env.CONNECTION_DB_TABLE,
      ProjectionExpression: 'roomId, connectionId', //fetch needed attributes
      FilterExpression: 'connectionId = :cid', // find matching connectionId
      ExpressionAttributeValues: { ':cid': connectionId },
    };

    const data = await doccli.send(new ScanCommand(scanParams));

    if (data.Items && data.Items.length > 0) {
      roomId = data.Items[0].roomId; //extract roomid if found
    } else {
      console.warn('No matching room found for connectionId');
      return { statusCode: 404, body: JSON.stringify('Room not found') };
    }
  } catch (err) {
    console.error('Error retrieving roomId:', err);
    return { statusCode: 500, body: JSON.stringify('Internal server error') };
  }

  try {
    await doccli.send(
      new PutCommand({
        TableName: process.env.MAIN_TABLE, // main application table from environmental variables
        Item: {
          PK: `room#${roomId}`, // room#<roomId>
          SK: `message#${timestamp}`, // message#<timestamp>
          ConnectionId: connectionId,
          SenderId: senderId, // used for MessagesBySender GSI
          Content: message,
          Timestamp: timestamp, // used for MessagesBySender GSI
          RoomId: roomId, // optional can help with other queries
          SenderUsername: senderUsername,
        },
      })
    );
    console.log('Message saved to DynamoDB:', msg);
  } catch (err) {
    console.error('Error saving message to DynamoDB:', err);
  }

  // Setup API Gateway management client
  const domain = event.requestContext.domainName; // domain of websocket api
  const stage = event.requestContext.stage; // deployment stage
  const endpoint = `https://${domain}/${stage}`;
  const agmac = new ApiGatewayManagementApi({ apiVersion: 'latest', endpoint });

  // Get all connections in the room
  let connections;
  try {
    const queryParams = {
      TableName: process.env.CONNECTION_DB_TABLE,
      ProjectionExpression: 'roomId, connectionId',
      KeyConditionExpression: 'roomId = :rid', //Query by roomID
      ExpressionAttributeValues: { ':rid': roomId },
    };
    const data = await doccli.send(new QueryCommand(queryParams));
    connections = data.Items; //all connections in chat room
  } catch (err) {
    console.error('Error fetching connections in room:', err);
    return { statusCode: 500, body: JSON.stringify('Internal server error') };
  }

  // Broadcast message to all connections
  try {
    await Promise.all(
      connections.map(async ({ connectionId }) => {
        try {
          //send message to each connection via websocket
          await agmac.send(
            new PostToConnectionCommand({
              ConnectionId: connectionId,
              Data: JSON.stringify({
                senderId,
                message,
                timestamp,
                senderUsername,
              }),
            })
          );
        } catch (err) {
          //if disconnected remove from table
          if (err.statusCode === 410) {
            console.log(`Stale connection, deleting ${connectionId}`);
            await doccli.send(
              new DeleteCommand({
                TableName: process.env.CONNECTION_DB_TABLE,
                Key: { roomId, connectionId },
              })
            );
          } else {
            console.error(`Send error for connection ${connectionId}:`, err);
          }
        }
      })
    );
  } catch (err) {
    console.error('Error broadcasting message:', err);
    return { statusCode: 500, body: JSON.stringify('Internal server error') };
  }

  return { statusCode: 200, body: JSON.stringify('Message sent') };
};
