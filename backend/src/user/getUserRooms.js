const {
  QueryCommand,
  GetCommand,
  BatchGetCommand,
} = require('@aws-sdk/lib-dynamodb');
const { sendResponse } = require('../helpers');
const { doccli } = require('../ddbconn');

module.exports.handler = async (event) => {
  try {
    const userId = event.pathParameters.userId;

    // Getting all of the user's rooms
    const roomResult = await doccli.send(
      new QueryCommand({
        TableName: process.env.MAIN_TABLE,
        IndexName: 'UserRooms',
        KeyConditionExpression: 'UserId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      })
    );

    const rooms = roomResult.Items || [];

    // Getting metadata + member user data for each room
    const detailedRooms = await Promise.all(
      rooms.map(async (room) => {
        const roomId = room.RoomId;

        const roomMetaRes = await doccli.send(
          new GetCommand({
            TableName: process.env.MAIN_TABLE,
            Key: {
              PK: `CHAT#${roomId}`,
              SK: `META#CHAT#${roomId}`,
            },
          })
        );

        const roomMeta = roomMetaRes.Item || {};
        const memberIds = roomMeta.Users || [];

        let members = [];
        if (memberIds.length > 0) {
          // Getting all users
          const batchRes = await doccli.send(
            new BatchGetCommand({
              RequestItems: {
                [process.env.MAIN_TABLE]: {
                  Keys: memberIds.map((id) => ({
                    PK: `USER#${id}`,
                    SK: 'PROFILE',
                  })),
                },
              },
            })
          );
          members = batchRes.Responses?.[process.env.MAIN_TABLE] || [];
        }

        return {
          RoomId: roomId,
          RoomMeta: roomMeta,
          Members: members,
        };
      })
    );

    return sendResponse(200, { rooms: detailedRooms });
  } catch (err) {
    console.error('getUserRooms error:', err);
    return sendResponse(500, {
      message: 'Failed to fetch user rooms with members',
      error: err.message,
    });
  }
};
