const { doccli } = require('../ddbconn');
const { sendResponse } = require('../helpers');
const {
  PutCommand,
  DeleteCommand,
  GetCommand,
} = require('@aws-sdk/lib-dynamodb');
const {
  ApiGatewayManagementApi,
} = require('@aws-sdk/client-apigatewaymanagementapi');

const {
  ApiGatewayV2Client,
  GetApisCommand,
} = require('@aws-sdk/client-apigatewayv2');

const notificationLambda = require('../notifications/notifSend');
const MAIN_TABLE = process.env.MAIN_TABLE;
const AWS_REGION = process.env.AWS_REGION;
const WS_API_NAME = 'dev-synerra-backend-websockets'; // WebSocket API name
const STAGE = 'dev';

// Since this is an HTTP-api lambda we need to get the Websocket endpoint manually with this function
async function getWebSocketEndpoint() {
  const agApiClient = new ApiGatewayV2Client({ region: AWS_REGION });
  const apis = await agApiClient.send(new GetApisCommand({}));
  const wsApi = apis.Items.find((api) => api.Name === WS_API_NAME);
  if (!wsApi) throw new Error(`WebSocket API "${WS_API_NAME}" not found`);
  const fullUrl = wsApi.ApiEndpoint;
  const urlWithoutProtocol = fullUrl.startsWith('wss://') // remove extra parts of the url
    ? fullUrl.slice(6)
    : fullUrl;
  return urlWithoutProtocol;
}

module.exports.handler = async (event) => {
  const wsEndpoint = await getWebSocketEndpoint();
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

      // call the notification handler to send notifications of the friend-request
      try {
        await notificationLambda.handler({
          userId: targetUserId, // receiver
          payload: {
            type: 'friend_request',
            fromUserId: authUserId,
            fromUsername: senderUsername,
            fromPicture: senderPfp,
            message: `${senderUsername} sent you a friend request`,
            timestamp,
          },
          domainName: wsEndpoint, // pass domainName to notification handler
          stage: STAGE, // pass the stage also
        });
        console.log(
          `WebSocket friend request notification sent to ${targetUserId}`
        );
      } catch (notifyErr) {
        console.error('Error sending WebSocket notification:', notifyErr);
      }

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

      // Create new database item for accepted request
      const acceptedItem = {
        PK: `USER#${authUserId}`,
        SK: `FRIEND_REQUEST#${targetUserId}`,
        GSI1PK: `USER#${targetUserId}`,
        GSI1SK: `FRIEND_REQUEST#${authUserId}`,
        Relation: 'FRIEND_REQUEST',
        Status: 'ACCEPTED',
        CreatedAt: timestamp,
        SenderUsername: senderUsername,
        SenderPicture: senderPfp,
        SenderId: authUserId,
      };

      await doccli.send(
        new PutCommand({
          TableName: MAIN_TABLE,
          Item: acceptedItem,
        })
      );
      // call the notification handler to send notifications of the friend-request
      try {
        await notificationLambda.handler({
          userId: targetUserId,
          payload: {
            type: 'friend_request_accepted',
            fromUserId: authUserId,
            fromPicture: senderPfp,
            message: `${senderUsername} accepted your friend request`,
            timestamp,
          },
          domainName: wsEndpoint, // pass domain name
          stage: STAGE, //pass the stage
        });
        console.log(`Acceptance notification sent to ${targetUserId}`);
      } catch (notifyErr) {
        console.error('Error sending acceptance notification:', notifyErr);
      }
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

      // Create new database item for declined request
      const declinedItem = {
        PK: `USER#${authUserId}`,
        SK: `FRIEND_REQUEST#${targetUserId}`,
        GSI1PK: `USER#${targetUserId}`,
        GSI1SK: `FRIEND_REQUEST#${authUserId}`,
        Relation: 'FRIEND_REQUEST',
        Status: 'DECLINED',
        CreatedAt: timestamp,
        SenderUsername: senderUsername,
        SenderPicture: senderPfp,
        SenderId: authUserId,
      };

      await doccli.send(
        new PutCommand({
          TableName: MAIN_TABLE,
          Item: declinedItem,
        })
      );
      // call the notification handler to send notifications of the friend-request
      try {
        await notificationLambda.handler({
          userId: targetUserId,
          payload: {
            type: 'friend_request_declined',
            fromUserId: authUserId,
            fromPicture: senderPfp,
            message: `${senderUsername} declined your friend request`,
            timestamp,
          },
          domainName: wsEndpoint, //pass the domainName
          stage: STAGE, // pass the stage
        });
        console.log(`Decline notification sent to ${targetUserId}`);
      } catch (notifyErr) {
        console.error('Error sending decline notification:', notifyErr);
      }
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
