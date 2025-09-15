/*
Registration to cognito with email and password:
{
"email": "omanimi@jamk.fi",
"password": "moi123"
}
Registration does not provide the JWT-token, you have to login first
*/
const AWS = require('@aws-sdk/client-cognito-identity-provider');
const { sendResponse, validateInput } = require('../helpers');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
//new cognito client
const cognito = new AWS.CognitoIdentityProvider();
//new ddb client
const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
//new ddb document-client
const docClient = DynamoDBDocumentClient.from(dynamodb);
//get the correct table from environmental variables
const MAIN_TABLE = process.env.MAIN_TABLE;

module.exports.handler = async (event) => {
  try {
    // Validate input
    const isValid = validateInput(event.body);
    if (!isValid) {
      return sendResponse(400, { message: 'Invalid input' });
    }
    //parse the event body from json
    const { email, password } = JSON.parse(event.body);
    // get the user pool id from environmental variables
    const { USER_POOL_ID } = process.env;

    // create user in Cognito
    const params = {
      UserPoolId: USER_POOL_ID,
      Username: email, // use email as username
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' }, //verify email-automatically
      ],
      MessageAction: 'SUPPRESS',
    };

    //calls cognito to create the user
    const response = await cognito.adminCreateUser(params);

    //set permanent password
    if (response.User) {
      const paramsForSetPass = {
        Password: password,
        UserPoolId: USER_POOL_ID,
        Username: email,
        Permanent: true, // make the password permanent
      };
      await cognito.adminSetUserPassword(paramsForSetPass);
    }

    // extract userId (sub) from Cognito user attributes
    let userId = null;
    if (response.User?.Attributes) {
      const subAttr = response.User.Attributes.find(
        (attr) => attr.Name === 'sub'
      );
      if (subAttr) {
        userId = subAttr.Value; //unique userID
      }
    }

    // If no sub found, fall back to Username
    if (!userId && response.User?.Username) {
      userId = response.User.Username;
    }
    //current timestamp
    const now = Math.floor(Date.now() / 1000);

    // prepares the ddb item to store userinfo
    const item = {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      UserId: userId,
      Email: email,
      CreatedAt: now,
    };

    //send the user info to ddb table
    await docClient.send(
      new PutCommand({
        TableName: MAIN_TABLE,
        Item: item,
      })
    );

    // successful response with userid
    return sendResponse(200, {
      message: 'User registration successful',
      userId,
    });
  } catch (error) {
    //error logs
    console.error('Signup error:', error);
    const message = error.message ? error.message : 'Internal server error';
    return sendResponse(500, { message });
  }
};
