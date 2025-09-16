const AWS = require('aws-sdk');
const { sendResponse } = require('../helpers');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');

const { doccli } = require('../ddbconn');

module.exports.handler = async (event) => {
  try {
    // Gets the userId from the url
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return sendResponse(400, { message: 'userId is required' });
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
  } catch (err) {
    console.error(err);
    return sendResponse(500, { message: 'Failed to fetch user' });
  }
};
