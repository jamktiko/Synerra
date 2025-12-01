// enterRoomHandler
const { doccli } = require('./ddbconn.js');
const {
  PutCommand,
  QueryCommand,
  GetCommand,
} = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} = require('@aws-sdk/client-apigatewaymanagementapi');

module.exports.handler = async (event) => {
  try {
    const connectionId = event.requestContext?.connectionId;
    const userId = event.requestContext.authorizer?.sub;

    if (!userId) {
      console.log('USERID: ', userId);
      return { statusCode: 400, body: 'Missing userId' };
    }
    if (!connectionId) {
      console.log('CONNECTION ID: ', connectionId);
      return { statusCode: 400, body: 'Missing connectionId' };
    }

    const body = JSON.parse(event.body);
    console.log('BODY: ', body);

    if (body.targetUserId) {
      return await enterRoomWithUserId();
    } else if (body.targetRoomId) {
      return await enterRoomwithRoomId();
    } else {
      throw new Error('no targetUserId or targetRoomId');
    }

    // Function for joining a room with the roomId
    async function enterRoomwithRoomId() {
      console.log('Entering room with roomId');
      const targetRoomId = body.targetRoomId;
      console.log('targetRoomId: ', targetRoomId);

      if (!targetRoomId) {
        return {
          statusCode: 400,
          body: 'Missing targetRoomId',
        };
      }

      // Queries all rooms for this user from GSI
      const userRooms = await doccli.send(
        new QueryCommand({
          TableName: process.env.MAIN_TABLE,
          IndexName: 'UserRooms',
          KeyConditionExpression: 'UserId = :uid',
          ExpressionAttributeValues: { ':uid': userId },
        })
      );

      console.log('User rooms:', userRooms.Items);

      // Checks if targetRoomId is in user’s rooms
      let hasAccess = false;
      for (const item of userRooms.Items) {
        const roomId = item.RoomId;
        if (roomId === targetRoomId) {
          hasAccess = true;
          break;
        }
      }

      if (!hasAccess) {
        return {
          statusCode: 403,
          body: 'User not part of this room',
        };
      }

      // Maps connection to the room
      const connectionParams = {
        TableName: process.env.CONNECTION_DB_TABLE,
        Item: { roomId: targetRoomId, connectionId, userId, type: 'chatroom' },
      };
      await doccli.send(new PutCommand(connectionParams));
      console.log('Mapped connection to room:', targetRoomId);

      // Sends confirmation back to client
      const domainName = event.requestContext.domainName;
      const stage = event.requestContext.stage;
      const apigw = new ApiGatewayManagementApiClient({
        endpoint: `https://${domainName}/${stage}`,
      });

      await apigw.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({ roomId: targetRoomId }),
        })
      );

      console.log('Success: connected to room', targetRoomId);
      return { statusCode: 200 };
    }

    async function enterRoomWithUserId() {
      console.log('Entering room with userId');
      const targetUserIds = body.targetUserId;
      console.log('TARGET IDS', targetUserIds);

      if (
        !targetUserIds ||
        !Array.isArray(targetUserIds) ||
        targetUserIds.length === 0
      ) {
        return {
          statusCode: 400,
          body: 'Missing targetUserIds',
        };
      }

      // Merge requester + targets, dedupe, sort (deterministic ordering)
      const members = Array.from(new Set([userId, ...targetUserIds])).sort();
      console.log(members);

      // Gets all rooms each user is apart of
      const candidateRoomSets = await Promise.all(
        members.map(async (id) => {
          const result = await doccli.send(
            new QueryCommand({
              TableName: process.env.MAIN_TABLE,
              IndexName: 'UserRooms', // GSI with partition key = UserId
              KeyConditionExpression: 'UserId = :uid',
              ExpressionAttributeValues: { ':uid': id },
            })
          );
          return result.Items.map((item) => item.PK.split('#')[1]); // extract roomId
        })
      );
      console.log('CandidateRoomSets: ', candidateRoomSets);

      // Checks for all the rooms that every user has in common
      let candidateRoomIds = candidateRoomSets.reduce(
        (a, b) => a.filter((x) => b.includes(x)),
        candidateRoomSets[0] || []
      );
      console.log('Candidate roomsIds', candidateRoomIds);
      // Checks for exact match
      let roomId = null;
      for (const rId of candidateRoomIds) {
        const roomMeta = await doccli.send(
          new GetCommand({
            TableName: process.env.MAIN_TABLE,
            Key: { PK: `CHAT#${rId}`, SK: `META#CHAT#${rId}` },
          })
        );
        console.log(roomMeta);
        if (!roomMeta.Item) continue;
        if (
          JSON.stringify(roomMeta.Item.Users.sort()) === JSON.stringify(members)
        ) {
          roomId = rId;
          break;
        }
      }

      // If no match, creates a new room
      if (!roomId) {
        roomId = uuidv4();

        // Creates room metadata
        const roomMetaParams = {
          TableName: process.env.MAIN_TABLE,
          Item: {
            PK: `CHAT#${roomId}`,
            SK: `META#CHAT#${roomId}`,
            Type: 'ChatRoom',
            CreatedAt: new Date().toISOString(),
            Users: members,
          },
          ConditionExpression:
            'attribute_not_exists(PK) AND attribute_not_exists(SK)',
        };

        // Creates member items
        console.log('TEKEE UUDEN MEMBER-TABLE YHTEYS ITEMI JUTUN');
        const memberCommands = members.map(
          (id) =>
            new PutCommand({
              TableName: process.env.MAIN_TABLE,
              Item: {
                PK: `CHAT#${roomId}#USER#${id}`,
                SK: `MEMBER#USER#${id}`,
                Type: 'Member',
                UserId: id, // GSI partition key
                RoomId: roomId, // GSI sort key
                JoinedAt: new Date().toISOString(),
              },
              ConditionExpression:
                'attribute_not_exists(PK) AND attribute_not_exists(SK)',
            })
        );

        await Promise.all([
          doccli.send(new PutCommand(roomMetaParams)),
          ...memberCommands.map((cmd) => doccli.send(cmd)),
        ]);
      }

      console.log('Meta paramsit databaseen');

      // Maps WebSocket connection
      const connectionParams = {
        TableName: process.env.CONNECTION_DB_TABLE,
        Item: { roomId, connectionId, userId, type: 'chatroom' },
      };
      await doccli.send(new PutCommand(connectionParams));
      console.log('Tiedot connection tableen...');

      // Sends room info back to client
      const domainName = event.requestContext.domainName;
      const stage = event.requestContext.stage;
      const apigw = new ApiGatewayManagementApiClient({
        endpoint: `https://${domainName}/${stage}`,
      });

      await apigw.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({ roomId, members }),
        })
      );
      console.log('Sendataan');

      console.log('Success: connected to room', roomId, members);
      return { statusCode: 200 };
    }
  } catch (err) {
    console.error('Error in enterroomHandler:', err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
