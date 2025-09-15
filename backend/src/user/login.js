/*
loggautuminen Cognitoon emaililla ja salasanalla
*/
const AWS = require('@aws-sdk/client-cognito-identity-provider');
const { sendResponse, validateInput } = require('../helpers');

const cognito = new AWS.CognitoIdentityProvider();

module.exports.handler = async (event) => {
  try {
    // validateInput tarkistaa että bodyssa tuli oikeaa dataa
    const isValid = validateInput(event.body);
    if (!isValid) {
      return sendResponse(400, { message: 'Invalid input' });
    }

    const { email, password } = JSON.parse(event.body);
    const { USER_POOL_ID, USER_CLIENT_ID } = process.env;

    // params-oliossa ovat tiedot jotka lähetetään cognitoon
    const params = {
      AuthFlow: 'ADMIN_NO_SRP_AUTH', // autentikaatio usernamella(email) ja passwordilla
      UserPoolId: USER_POOL_ID,
      ClientId: USER_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };
    // suoritetaan autentikaatio cognitossa ja saadaan vastaus
    const response = await cognito.adminInitiateAuth(params);
    // jos homma onnistui, toimitetaan token
    return sendResponse(200, {
      message: 'Success',
      token: response.AuthenticationResult.IdToken,
    });
  } catch (error) {
    const message = error.message ? error.message : 'Internal server error';
    return sendResponse(500, { message });
  }
};
