const AWS = require('aws-sdk');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { sendResponse } = require('../helpers');

const { doccli } = require('../ddbconn');

module.exports.handler = async (event) => {
  try {
    //Parameters for the DynamoDb query
    const params = {
      TableName: process.env.MAIN_TABLE, //correct table from the environmental variables
      IndexName: 'UsernameIndex', // Global secondary index that holds all the users
      KeyConditionExpression: 'GSI3PK = :pk',
      // Fetch only items where the GSI3PK equals USER
      ExpressionAttributeValues: {
        ':pk': 'USER', // only user items
      },
    };
    //sends the query to DynamoDb
    const result = await doccli.send(new QueryCommand(params));
    const users = result.Items || [];

    // Check online status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const userId = user.PK.replace('USER#', '');
        const connectionResult = await doccli.send(
          new QueryCommand({
            TableName: process.env.CONNECTION_DB_TABLE,
            IndexName: 'UserIdIndex', //Query by UserIdIndex
            KeyConditionExpression: 'userId = :uid',
            FilterExpression: '#t = :typeVal',
            ExpressionAttributeNames: { '#t': 'type' },
            ExpressionAttributeValues: {
              ':uid': userId,
              ':typeVal': 'notifications',
            },
          })
        );

        // returns the online status for each user
        return {
          ...user,
          Status: connectionResult.Items?.length ? 'online' : 'offline',
        };
      })
    );

    return sendResponse(200, { users: usersWithStatus });
  } catch (err) {
    console.error(err);
    return sendResponse(500, {
      message: 'Failed to fetch users',
      error: err.message,
    });
  }
};
