/*
Rekisteröityminen Cognitoon antamalla email ja salasana:
{
"email": "omanimi@jamk.fi",
"password": "moi123"
}
Rekisteröitymisen jälkeen ei vielä saada tokenia, vaan se saadaan vasta
kun kirjaudutaan sisään käyttäen login-reittiä.
*/
const AWS = require('@aws-sdk/client-cognito-identity-provider');
const { sendResponse, validateInput } = require('../helpers');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const cognito = new AWS.CognitoIdentityProvider();
const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const USER_TABLE = process.env.USER_TABLE;

module.exports.handler = async (event) => {
  try {
    // Validate input
    const isValid = validateInput(event.body);
    if (!isValid) {
      return sendResponse(400, { message: 'Invalid input' });
    }

    const { email, password } = JSON.parse(event.body);
    const { USER_POOL_ID } = process.env;

    // Create user in Cognito
    const params = {
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
      ],
      MessageAction: 'SUPPRESS',
    };

    const response = await cognito.adminCreateUser(params);

    // Set permanent password
    if (response.User) {
      const paramsForSetPass = {
        Password: password,
        UserPoolId: USER_POOL_ID,
        Username: email,
        Permanent: true,
      };
      await cognito.adminSetUserPassword(paramsForSetPass);
    }

    // Extract userId (sub) from Cognito user attributes
    let userId = null;
    if (response.User?.Attributes) {
      const subAttr = response.User.Attributes.find(
        (attr) => attr.Name === 'sub'
      );
      if (subAttr) {
        userId = subAttr.Value;
      }
    }

    // If no sub found, fall back to Username
    if (!userId && response.User?.Username) {
      userId = response.User.Username;
    }

    const now = Math.floor(Date.now() / 1000);

    // Save user to DynamoDB
    const putItemParams = {
      TableName: USER_TABLE,
      Item: {
        PK: { S: `USER#${userId}` }, // Use Cognito userId as primary key
        SK: { S: 'PROFILE' },
        userId: { S: userId },
        email: { S: email },
        createdAt: { N: now.toString() },
      },
    };

    await dynamodb.send(new PutItemCommand(putItemParams));

    return sendResponse(200, {
      message: 'User registration successful',
      userId,
    });
  } catch (error) {
    console.error('Signup error:', error);
    const message = error.message ? error.message : 'Internal server error';
    return sendResponse(500, { message });
  }
};
