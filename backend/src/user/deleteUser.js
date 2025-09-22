const AWS = require('aws-sdk');
//DynamoDb document client import
const { doccli } = require('../ddbconn');
//helper imports
const { sendResponse, verifyUser } = require('../helpers');
//Query and Delete command imports
const { QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
//Cognito imports
const {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const MAIN_TABLE = process.env.MAIN_TABLE; //Correct table from environmental variables
const USER_POOL_ID = process.env.USER_POOL_ID; // Userpool ID
const cognitoClient = new CognitoIdentityProviderClient({
  //New Cognito-client
  region: process.env.AWS_REGION,
});

// Handler export
module.exports.handler = async (event) => {
  try {
    console.log('Full event:', JSON.stringify(event, null, 2));
    console.log('Auth claims:', event.requestContext?.authorizer);

    //verifies that the user is deleting his own profile
    const userId = verifyUser(event);

    console.log('Deleting userId:', userId);

    // Delete all DynamoDB items for the user
    const queryParams = {
      TableName: MAIN_TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `USER#${userId}` }, //searches all items that has this Partition Key
    };

    const queryResult = await doccli.send(new QueryCommand(queryParams)); // Sends the query to DynamoDb
    const userItem = queryResult.Items?.find((item) => item.SK === 'PROFILE');
    if (!userItem) {
      return sendResponse(404, { message: 'User not found in DB' }); // Return HTTP 404 if no user was found in DynamoDB
    }
    const email = userItem.Email; // Extract the email from the DynamoDB item

    if (!email) {
      return sendResponse(400, { message: 'email missing' });
      // Return HTTP 400 if email is missing
    }

    // Loop through all items returned by the query and delete them from DynamoDB
    for (const item of queryResult.Items) {
      await doccli.send(
        new DeleteCommand({
          TableName: MAIN_TABLE,
          Key: { PK: item.PK, SK: item.SK },
        })
      );
    }

    // Delete the user from Cognito using the email as the username
    await cognitoClient.send(
      new AdminDeleteUserCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: email,
      })
    );

    // Delete the user from Cognito using the email as the username
    return sendResponse(200, {
      message: 'User deleted from DynamoDB and Cognito successfully',
      deletedItems: queryResult.Items?.length || 0,
    });
  } catch (err) {
    console.error('Delete user error:', err);
    return sendResponse(500, {
      message: 'Failed to delete user',
      error: err.message,
    });
  }
};
