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
  let { SenderId, RoomId, Content, Timestamp, SenderUsername, ProfilePicture } =
    JSON.parse(event.body).data;
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
      console.log('DATA.ITEMS', data.Items);
      RoomId = data.Items[0].roomId; //extract roomid if found
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
          PK: `room#${RoomId}`, // room#<roomId>
          SK: `message#${Timestamp}`, // message#<timestamp>
          ConnectionId: connectionId,
          SenderId, // used for MessagesBySender GSI
          Content,
          Timestamp, // used for MessagesBySender GSI
          RoomId, // optional can help with other queries
          SenderUsername,
          ProfilePicture,
        },
      })
    );
    console.log('Message saved to DynamoDB:', Content);
  } catch (err) {
    console.error('Error saving message to DynamoDB:', err);
  }

  //  Create unread markers for offline recipients
  let allParticipants = [];
  let membershipData;
  try {
    console.log('Fetching membershipdata');
    // Fetching all members of the room
    membershipData = await doccli.send(
      new QueryCommand({
        TableName: process.env.MAIN_TABLE,
        IndexName: 'RoomMembersIndex',
        KeyConditionExpression: 'roomId = :rid',
        ExpressionAttributeValues: { ':rid': RoomId },
        ProjectionExpression: 'UserId',
      })
    );
    allParticipants = membershipData.Items.map((i) => i.UserId).filter(
      (uid) => uid !== SenderId // exclude sender
    );
    console.log('All participants', allParticipants);

    await Promise.all(
      allParticipants.map((uid) =>
        doccli.send(
          new PutCommand({
            TableName: process.env.MAIN_TABLE,
            Item: {
              PK: `USER#${uid}`, // partition key for user
              SK: `UNREAD#${Timestamp}`, // sort key for unread message
              MessageId: Timestamp,
              RoomId,
              SenderId,
              SenderUsername,
              Content,
              ProfilePicture,
              GSI1PK: `USER#${uid}`, // 🔹 key for UnreadMessagesIndex
              GSI1SK: `UNREAD#${Timestamp}`, // 🔹 key for UnreadMessagesIndex
              Timestamp,
            },
          })
        )
      )
    );
  } catch (err) {
    console.error('Error creating unread markers:', err);
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
      ExpressionAttributeValues: { ':rid': RoomId },
    };
    const data = await doccli.send(new QueryCommand(queryParams));
    connections = data.Items; //all connections in chat room
  } catch (err) {
    console.error('Error fetching connections in room:', err);
    return { statusCode: 500, body: JSON.stringify('Internal server error') };
  }

  console.log('connections, ', connections);
  try {
    await Promise.all(
      connections.map(async ({ connectionId }) => {
        try {
          //sends message to each connection via websocket
          await agmac.send(
            new PostToConnectionCommand({
              ConnectionId: connectionId,
              Data: JSON.stringify({
                SenderId,
                Content,
                Timestamp,
                SenderUsername,
                ProfilePicture,
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
                Key: { RoomId, connectionId },
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
