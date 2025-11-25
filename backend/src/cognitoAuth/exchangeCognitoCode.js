const axios = require('axios');
const { doccli } = require('../ddbconn');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const MAIN_TABLE = process.env.MAIN_TABLE;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const code = body.code;

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing code' }),
      };
    }

    const clientId = process.env.USER_CLIENT_ID; // client ID
    const redirectUri = process.env.REDIRECT_URI; // redirect URI
    const cognitoDomain = process.env.COGNITO_DOMAIN; // cognito DOMAIN
    const allowedOrigins = [
      'http://localhost:4200',
      'https://d2lqv34okdzcq4.cloudfront.net',
    ];
    const origin = event.headers.origin;
    const allowedOrigin = allowedOrigins.includes(origin) ? origin : '';

    // Object for building "form-encoded data"
    const params = new URLSearchParams();
    // Cognito's /oauth2/token requires a very specific form of data for exchanging the code for tokens.
    // AI helped a ton here
    params.append('grant_type', 'authorization_code');
    params.append('client_id', clientId);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    // Calling cognito with the right form of data (params)
    const response = await axios.post(
      `${cognitoDomain}/oauth2/token`,
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('RESPONSE: ', response.data);
    // The call should return a couple of different cognito user's tokens in the response (id_token, refresh_token)
    if (!response.data.id_token) throw new Error('No id_token returned');

    // Takes id_token (jwt) from the code exchange response and decodes it for all the user's data
    const base64Payload = response.data.id_token
      .split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const payload = JSON.parse(
      Buffer.from(base64Payload, 'base64').toString('utf8')
    );

    // Getting current date
    const now = Math.floor(Date.now() / 1000);

    // Uses the decoded user data for making a dynamodb user for the cognito user
    const item = {
      TableName: MAIN_TABLE,
      Key: {
        PK: `USER#${payload.sub}`,
        SK: 'PROFILE',
      },
      UpdateExpression:
        'SET Email = :email, CreatedAt = if_not_exists(CreatedAt, :createdAt), UserId = :userId, GSI3PK = :gsi3pk',
      ExpressionAttributeValues: {
        ':email': payload.email,
        ':createdAt': now,
        ':userId': payload.sub,
        ':gsi3pk': 'USER',
      },
      ReturnValues: 'ALL_NEW', // returns the updated item
    };

    // send to dynamodb
    const updatedItem = await doccli.send(new UpdateCommand(item));
    console.log('Updated item:', updatedItem);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Credentials': 'true',
      },
      body: JSON.stringify({
        message: 'Profile added to dynamodb!',
        data: updatedItem,
        tokens: {
          id_token: response.data.id_token,
          refresh_token: response.data.refresh_token,
        },
      }),
    };
  } catch (err) {
    console.error(err.response?.data || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to exchange code' }),
    };
  }
};
