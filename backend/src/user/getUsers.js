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

    // successful response, status code 200
    return {
      statusCode: 200,
      body: JSON.stringify({ users: result.Items }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch users' }),
    };
  }
};
