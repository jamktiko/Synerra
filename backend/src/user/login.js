/*
logging into Cognito with email and password
*/
const AWS = require('@aws-sdk/client-cognito-identity-provider');
const { sendResponse, validateInput } = require('../helpers');

//new Cognito Identity provider client
const cognito = new AWS.CognitoIdentityProvider();

module.exports.handler = async (event) => {
  try {
    // validate the input so that the data is in correct format
    const isValid = validateInput(event.body);
    if (!isValid) {
      return sendResponse(400, { message: 'Invalid input' });
    }
    //parse the event body
    const { email, password } = JSON.parse(event.body);
    //get the User pool id and user client id from environmental variables
    const { USER_POOL_ID, USER_CLIENT_ID } = process.env;

    // params includes data sent to Cognito
    const params = {
      AuthFlow: 'ADMIN_NO_SRP_AUTH', //authentication with username(email) and password
      UserPoolId: USER_POOL_ID,
      ClientId: USER_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };
    // do the authentication in cognito and get response
    const response = await cognito.adminInitiateAuth(params);
    // if it succeeds the token is sent
    return sendResponse(200, {
      message: 'Success',
      token: response.AuthenticationResult.IdToken,
      refreshToken: response.AuthenticationResult.RefreshToken,
      accessToken: response.AuthenticationResult.AccessToken,
    });
  } catch (error) {
    const message = error.message ? error.message : 'Internal server error';
    return sendResponse(500, { message });
  }
};
