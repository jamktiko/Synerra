const AWS = require('aws-sdk');
const { sendResponse } = require('../helpers');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');

const { doccli } = require('../ddbconn');

module.exports.handler = async (event) => {
  try {
    // Extract userId from the JWT authorizer
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized: no user ID found' }),
      };
    }

    // Parameters for the dynamodb operation
    const params = {
      TableName: process.env.MAIN_TABLE,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
    };

    // DynamoDB get command with the parameters
    const result = await doccli.send(new GetCommand(params));

    if (!result.Item) {
      return sendResponse(404, { message: 'User not found' });
    }

    return sendResponse(200, result.Item);
  } catch (error) {
    console.error('Error in /me handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
