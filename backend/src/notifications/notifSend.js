const { QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn');
const {
  ApiGatewayManagementApi,
  PostToConnectionCommand,
} = require('@aws-sdk/client-apigatewaymanagementapi');

// userid, payload, domainname and stage passed on from different lambdas
module.exports.handler = async ({ userId, payload, domainName, stage }) => {
  // Setup API Gateway management client
  const endpoint = `https://${domainName}/${stage}`;
  const agmac = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint,
  });

  let connections = [];
  console.log(
    'UserId: ',
    userId,
    'Payload: ',
    payload,
    'DomainName: ',
    domainName,
    'Stage: ',
    stage
  );

  //parameters for the query that finds the right connections (search by userIdIndex)
  try {
    const params = {
      TableName: process.env.CONNECTION_DB_TABLE,
      IndexName: 'UserIdIndex', // UserId GSI
      KeyConditionExpression: 'userId = :uid',
      FilterExpression: '#t = :notifType', // only notification connections
      ExpressionAttributeNames: { '#t': 'type' },
      ExpressionAttributeValues: {
        ':uid': userId,
        ':notifType': 'notifications',
      },
      ProjectionExpression: 'connectionId, #t',
    };

    // save the query result to data
    const data = await doccli.send(new QueryCommand(params));
    console.log('DATA:', data);
    if (data.Items && data.Items.length > 0) {
      connections = data.Items;
    } else {
      console.log(`No active notification connections for user ${userId}`);
      return; // nothing to send
    }
  } catch (err) {
    console.error('Error querying notification connections:', err);
    return;
  }

  // Send payload to each connection
  await Promise.all(
    connections.map(async ({ connectionId }) => {
      try {
        console.log('Payload:', payload);
        console.log('ConnectionId::', connectionId);
        await agmac.send(
          new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify(payload),
          })
        );
      } catch (err) {
        if (err.statusCode === 410) {
          console.log(`Stale connection, deleting ${connectionId}`);
          try {
            await doccli.send(
              new DeleteCommand({
                TableName: process.env.CONNECTION_DB_TABLE,
                Key: { userId, connectionId },
              })
            );
          } catch (delErr) {
            console.error(
              `Error deleting stale connection ${connectionId}:`,
              delErr
            );
          }
        } else {
          console.error(`Error sending to ${connectionId}:`, err);
        }
      }
    })
  );
};
