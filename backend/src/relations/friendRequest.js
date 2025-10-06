const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const {
  PutCommand,
  DeleteCommand,
  GetCommand,
} = require('@aws-sdk/lib-dynamodb');

const MAIN_TABLE = process.env.MAIN_TABLE;

module.exports.handler = async (event) => {
  try {
    console.log('Full event:', JSON.stringify(event, null, 2));

    // Authenticated user (sender or acceptor/decliner) from JWT claims
    const authUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;

    // Returns Unauthorized if no authUserId is not provided
    if (!authUserId) {
      return sendResponse(401, { message: 'Unauthorized' });
    }

    // Body must contain targetUserId and action
    const body = JSON.parse(event.body || '{}');
    const { targetUserId, action } = body;

    // If no targetUserId or action is provided
    if (!targetUserId || !action) {
      return sendResponse(400, {
        message: 'targetUserId and action are required',
      });
    }

    const userData = await doccli.send(
      new GetCommand({
        TableName: MAIN_TABLE,
        Key: { PK: `USER#${authUserId}`, SK: 'PROFILE' }, // or whatever SK you use for user profiles
      })
    );

    const senderUsername = userData.Item?.Username || 'Unknown';
    const senderPfp = userData.Item?.ProfilePicture || 'Unknown';

    //Timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // SEND friend request
    if (action === 'SEND') {
      const item = {
        PK: `USER#${authUserId}`, // PK = sender
        SK: `FRIEND_REQUEST#${targetUserId}`, // SK = request to target
        GSI1PK: `USER#${targetUserId}`, // For querying requests by target
        GSI1SK: `FRIEND_REQUEST#${authUserId}`, // Reverse lookup
        Relation: 'FRIEND_REQUEST', // Relation type
        Status: 'PENDING', // Initial status
        CreatedAt: timestamp, // Timestamp
        SenderUsername: senderUsername, // Sender
        SenderPicture: senderPfp, //pfp of the sender
        SenderId: authUserId, //senders userId
      };

      // Writes the friend request to DynamoDb, fails if it already exists
      await doccli.send(
        new PutCommand({
          TableName: MAIN_TABLE,
          Item: item,
          ConditionExpression:
            'attribute_not_exists(PK) AND attribute_not_exists(SK)',
        })
      );

      return sendResponse(201, {
        message: 'Friend request sent',
        relation: item,
      });
    }

    // ACCEPT friend request
    if (action === 'ACCEPT') {
      // Create friendship (both sides, two items)
      const friend1 = {
        PK: `USER#${authUserId}`,
        SK: `FRIEND#${targetUserId}`,
        Relation: 'FRIEND',
        CreatedAt: timestamp,
      };
      const friend2 = {
        PK: `USER#${targetUserId}`,
        SK: `FRIEND#${authUserId}`,
        Relation: 'FRIEND',
        CreatedAt: timestamp,
      };

      // Write both relations
      await doccli.send(
        new PutCommand({ TableName: MAIN_TABLE, Item: friend1 })
      );
      await doccli.send(
        new PutCommand({ TableName: MAIN_TABLE, Item: friend2 })
      );

      // Remove the pending request, when the request is accepted
      await doccli.send(
        new DeleteCommand({
          TableName: MAIN_TABLE,
          Key: {
            PK: `USER#${targetUserId}`,
            SK: `FRIEND_REQUEST#${authUserId}`,
          },
        })
      );

      return sendResponse(200, {
        message: 'Friend request accepted',
        friends: [friend1, friend2],
      });
    }

    // DECLINE friend request
    if (action === 'DECLINE') {
      await doccli.send(
        // Just declines the request by deleting it
        new DeleteCommand({
          TableName: MAIN_TABLE,
          Key: {
            PK: `USER#${targetUserId}`,
            SK: `FRIEND_REQUEST#${authUserId}`,
          },
        })
      );

      return sendResponse(200, { message: 'Friend request declined' });
    }

    // If action not valid
    return sendResponse(400, { message: 'Invalid action' });
  } catch (err) {
    console.error('Friend request error:', err);

    // Handles duplicate requests
    if (err.name === 'ConditionalCheckFailedException') {
      return sendResponse(409, { message: 'Friend request already exists' });
    }

    // Generic failure
    return sendResponse(500, {
      message: 'Failed to process friend request',
      error: err.message,
    });
  }
};
