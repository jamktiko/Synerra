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

const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const snsClient = new SNSClient({});
const sendNotification = require('./notifications/notifSend');

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

  // Get the correct room with connectionid
  try {
    const queryParams = {
      TableName: process.env.CONNECTION_DB_TABLE,
      IndexName: 'ConnectionIdIndex',
      KeyConditionExpression: 'connectionId = :cid',
      ExpressionAttributeValues: { ':cid': connectionId },
      ProjectionExpression: 'roomId, connectionId',
    };

    const data = await doccli.send(new QueryCommand(queryParams));

    if (data.Items && data.Items.length > 0) {
      RoomId = data.Items[0].roomId;
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
  console.log('Querying RoomMembersIndex for RoomId:', RoomId);
  try {
    console.log('Fetching membershipdata');
    // Fetching all members of the room
    membershipData = await doccli.send(
      new QueryCommand({
        TableName: process.env.MAIN_TABLE,
        IndexName: 'RoomMembersIndex',
        KeyConditionExpression: 'RoomId = :rid',
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
              GSI1PK: `USER#${uid}`, //key for UnreadMessagesIndex
              GSI1SK: `UNREAD#${Timestamp}`, // key for UnreadMessagesIndex
              Timestamp,
            },
          })
        )
      )
    );
  } catch (err) {
    console.error('Error creating unread markers:', err);
  }

  let activeConnections = [];
  try {
    const activeConnectionsData = await doccli.send(
      new QueryCommand({
        TableName: process.env.CONNECTION_DB_TABLE,
        KeyConditionExpression: 'roomId = :rid',
        ExpressionAttributeValues: { ':rid': RoomId },
        ProjectionExpression: 'connectionId, userId', // Make sure userId is stored when connecting
      })
    );
    activeConnections = activeConnectionsData.Items.map((c) => c.userId);
    console.log('Active users in room:', activeConnections);
  } catch (err) {
    console.error('Error checking active connections:', err);
  }

  // Send notifications only to users who are NOT active in the room
  for (const uid of allParticipants) {
    if (activeConnections.includes(uid)) {
      console.log(`Skipping notification for active user ${uid}`);
      continue;
    }

    await sendNotification.handler({
      userId: uid,
      payload: {
        type: 'newMessage',
        roomId: RoomId,
        senderId: SenderId,
        content: Content,
        timestamp: Timestamp,
        senderUsername: SenderUsername,
        profilePicture: ProfilePicture,
      },
      domainName: event.requestContext.domainName,
      stage: event.requestContext.stage,
    });
  }

  // Setup API Gateway management client
  const domain = event.requestContext.domainName; // domain of websocket api
  const stage = event.requestContext.stage; // deployment stage
  const endpoint = `https://${domain}/${stage}`;
  const agmac = new ApiGatewayManagementApi({ apiVersion: 'latest', endpoint });

  console.log('DOMAINI JA STAGE: ', domain, stage);
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
    console.log('YHTEYDEET', connections);
  } catch (err) {
    console.error('Error fetching connections in room:', err);
    return { statusCode: 500, body: JSON.stringify('Internal server error') };
  }

  console.log('connections, ', connections);
  try {
    await Promise.all(
      connections.map(async ({ connectionId, roomId }) => {
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
          console.log('ERORRIIII', err);
          if (err.statusCode === 410 || err.name === 'GoneException') {
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
