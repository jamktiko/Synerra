const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { sendResponse } = require('../helpers');
const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

// Exports the handler
module.exports.handler = async () => {
  try {
    const params = {
      TableName: process.env.MAIN_TABLE,
      // Filters items to include the ones that have the pk starting with USER# and sk set as PROFILE
      FilterExpression: 'begins_with(PK, :userPrefix) AND SK = :profile',
      ExpressionAttributeValues: {
        ':userPrefix': 'USER#',
        ':profile': 'PROFILE',
      },
    };

    // Scans the dynamodb with given params
    const result = await docClient.scan(params).promise();

    // Sorts and separates the db result for clean and readable return
    const users = result.Items.map((item) => ({
      userId: item.UserId || null,
      username: item.Username || null,
      email: item.Email || null,
      createdAt: item.CreatedAt
        ? new Date(item.CreatedAt * 1000).toISOString()
        : null,
      reputation: item.Reputation || null,
      online: item.Online || false,
    }));

    return sendResponse(200, users);
  } catch (err) {
    console.error(err);
    return sendResponse(500, { message: 'Failed to fetch users' });
  }
};
