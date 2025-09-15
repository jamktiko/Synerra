const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { sendResponse } = require('../helpers');
const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async () => {
  try {
    const params = {
      TableName: process.env.USER_TABLE,
    };

    const result = await docClient.scan(params).promise();

    // Now result.Items already have plain JS types
    const users = result.Items.map((item) => ({
      userId: item.userId || null,
      email: item.email || null,
      createdAt: item.createdAt || null,
    }));

    return sendResponse(200, users);
  } catch (err) {
    console.error(err);
    return sendResponse(500, { message: 'Failed to fetch users' });
  }
};
