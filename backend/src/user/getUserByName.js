const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { doccli } = require('../ddbconn'); // make sure you import your doc client
const { sendResponse } = require('../helpers');

module.exports.handler = async (event) => {
  try {
    //get the username from the event url
    const username = event.pathParameters?.username;

    //if no username is provided
    if (!username) {
      return sendResponse(400, { message: 'username is required' });
    }

    //Parameters for the DynamoDb query
    const params = {
      TableName: process.env.MAIN_TABLE, //correct table from the environmental variables
      IndexName: 'UsernameIndex', // Global secondary index that holds all the users
      KeyConditionExpression:
        'GSI3PK = :pk AND begins_with(Username, :username)', //Begins with query from all the users
      ExpressionAttributeValues: {
        ':pk': 'USER', //value for the Global Secondary Index partition key
        ':username': username, // username used for the search
      },
    };
    // send the query to DynamoDb
    const data = await doccli.send(new QueryCommand(params));

    // If the query finds no matching users
    if (!data.Items || data.Items.length === 0) {
      return sendResponse(404, { message: 'No matching users found' });
    }
    // successful response, status code 200
    return sendResponse(200, { users: data.Items });
  } catch (err) {
    console.error(err);
    return sendResponse(500, { message: 'Failed to fetch users' });
  }
};
