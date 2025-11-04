const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { doccli } = require('./ddbconn');
const AWS = require('aws-sdk');
const {
  PutCommand,
  DeleteCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const {
  ApiGatewayManagementApi,
  PostToConnectionCommand,
} = require('@aws-sdk/client-apigatewaymanagementapi');

//jwksClient for getting public keys from Cognito for identification
const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.USER_POOL_ID}/.well-known/jwks.json`,
});

//function to get the sign in key from JWKS using token's key id
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err); //return error if key catch fails
    callback(null, key.getPublicKey()); //provide the public key for JWT verification
  });
}
/************* Responses *******************************************/

const successfulResponse = {
  statusCode: 200,
  body: JSON.stringify('Success'),
};

const failedResponse = (statusCode, error) => ({
  statusCode,
  body: JSON.stringify(error),
});

/**************** Lambda functions ********************************/

//handler for $connect-route for Websocket
module.exports.connectHandler = async (event) => {
  console.log('Full $connect event:', JSON.stringify(event, null, 2));

  //extract token from authorization header or query string
  const token =
    event.headers?.Authorization?.split(' ')[1] ||
    event.queryStringParameters?.Auth;

  //reject connection if token missing
  if (!token) {
    console.log('No token found');
    return { statusCode: 401, body: 'Unauthorized' };
  }
  // verify token and decode user info
  const user = await module.exports.authorize(token);
  console.log('Decoded user:', user);

  if (!user) {
    console.log('Unauthorized connection attempt');
    return { statusCode: 401, body: 'Unauthorized' }; //reject invalid token
  }

  console.log('User connected:', user.email);

  const userId = user.sub; //get the userID
  const connectionId = event.requestContext.connectionId; // get the connectionId from event
  const type = event.queryStringParameters?.type; // connectionType from endpoint url
  console.log('INFO:', userId, connectionId, type);

  //checks the connection type if its notifications
  if (type === 'notifications') {
    try {
      //Queryes existing connections and checks to find the correct connection by userIdIndex
      // const existingConnections = await doccli.send(
      //   new QueryCommand({
      //     TableName: process.env.CONNECTION_DB_TABLE,
      //     IndexName: 'UserIdIndex',
      //     KeyConditionExpression: 'userId = :uid',
      //     FilterExpression: '#t = :typeVal',
      //     ExpressionAttributeNames: { '#t': 'type' },
      //     ExpressionAttributeValues: { ':uid': userId, ':typeVal': type },
      //   })
      // );

      // saves the new connection to connection-table
      await doccli.send(
        new PutCommand({
          TableName: process.env.CONNECTION_DB_TABLE,
          Item: {
            roomId: `user#${userId}`,
            connectionId,
            userId,
            type: 'notifications',
          },
        })
      );
      console.log(`Notification connection saved for user ${userId}`);
    } catch (err) {
      console.error('Error saving notification connection:', err);
      return { statusCode: 500, body: 'Internal server error' };
    }
  }
  await broadcastUserStatus(
    userId,
    'online',
    event.requestContext.domainName,
    event.requestContext.stage,
    connectionId
  );
  return {}; // Success, allow websocket connection
};

//handler for $disconnect-route
module.exports.disconnectHandler = async (event) => {
  console.log('OnDisconnect');
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) {
    console.log('ConnectionId not found!');
  }
  try {
    // Find connectionId and remove it from the table
    const result = await doccli.send(
      new QueryCommand({
        TableName: process.env.CONNECTION_DB_TABLE,
        IndexName: 'ConnectionIdIndex',
        KeyConditionExpression: 'connectionId = :cid',
        ExpressionAttributeValues: { ':cid': connectionId },
      })
    );

    console.log(result.Items);
    // if items are found
    if (result.Items?.length) {
      const item = result.Items[0];
      await doccli.send(
        //delete the items
        new DeleteCommand({
          TableName: process.env.CONNECTION_DB_TABLE,
          Key: { roomId: item.roomId, connectionId: item.connectionId },
        })
      );
      console.log(`Connection ${connectionId} removed for user ${item.userId}`);

      if (item.type === 'notifications') {
        await broadcastUserStatus(
          item.userId,
          'offline',
          event.requestContext.domainName,
          event.requestContext.stage
        );
      }
    }
  } catch (err) {
    console.error('Error during disconnect:', err);
    return { statusCode: 500, body: 'Error during disconnect' };
  }

  return { statusCode: 200, body: 'Disconnected' };
};

// default handler for unknown WebSocket messages
module.exports.defaultHandler = async () => {
  return failedResponse(404, 'No event found');
};

//JWT-authentication handler
module.exports.authorize = async (token) => {
  console.log('Authorization in progress');
  if (!token) return null;

  try {
    // Wrap JWT verification in a promise for async/await usage
    return await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey, // Get the public key dynamically from Cognito
        { audience: process.env.USER_CLIENT_ID }, // Validate the token audience matches your Cognito client
        (err, decoded) => {
          if (err) {
            console.error('JWT verification error:', err);
            reject(err);
          } else resolve(decoded); // Return decoded JWT payload
        }
      );
    });
  } catch (err) {
    console.log('JWT verification failed', err);
    return null;
  }
};

// Authorizer function for API Gateway / HTTP API JWT authorizer
module.exports.auth = async (event) => {
  const token = event.queryStringParameters?.Auth; // Get token from query string
  const user = await module.exports.authorize(token);
  // Return IAM policy for API Gateway authorizer
  return {
    principalId: user.sub, //unique useId from cognito token
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow', //allow access
          Resource: event.methodArn, //only for this API-method
        },
      ],
    },
    context: {
      username: user.email, // Pass additional info to Lambda via context
      sub: user.sub,
    },
  };
};

async function broadcastUserStatus(
  userId,
  status,
  domainName,
  stage,
  newConnectionId
) {
  const endpoint = `https://${domainName}/${stage}`;
  const apigw = new ApiGatewayManagementApi({ apiVersion: 'latest', endpoint });

  const connections = await doccli.send(
    new QueryCommand({
      TableName: process.env.CONNECTION_DB_TABLE,
      IndexName: 'TypeIndex',
      KeyConditionExpression: '#t = :type',
      ExpressionAttributeNames: { '#t': 'type' },
      ExpressionAttributeValues: { ':type': 'notifications' },
    })
  );

  if (!connections.Items?.length) return;

  const payload = JSON.stringify({ type: 'USER_STATUS', userId, status });
  console.log('Broadcast payload:', payload, newConnectionId); // <-- log payload

  for (const item of connections.Items) {
    console.log('begin loop...');
    console.log(item);
    if (item.connectionId === newConnectionId) continue;

    try {
      console.log(`Sending message to connection: ${item.connectionId}`);
      await apigw.send(
        new PostToConnectionCommand({
          ConnectionId: item.connectionId,
          Data: payload,
        })
      );
      console.log(`Message sent to ${item.connectionId}`);
    } catch (err) {
      console.error('Error broadcasting to connection', item.connectionId, err);
      if (err.statusCode === 410 || err.name === 'GoneException') {
        console.log(`Deleting stale connection ${item.connectionId}`);
        await doccli.send(
          new DeleteCommand({
            TableName: process.env.CONNECTION_DB_TABLE,
            Key: { roomId: item.roomId, connectionId: item.connectionId },
          })
        );
      }
    }
  }
}

// Export responses in case other modules need them
module.exports.successfulResponse = successfulResponse;
module.exports.failedResponse = failedResponse;
