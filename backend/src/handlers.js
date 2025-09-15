const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.USER_POOL_ID}/.well-known/jwks.json`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}
/************* Responses *******************************************/

const successfulResponse = {
  statusCode: 200,
  body: JSON.stringify('Success'),
};

const failedResponse = (statusCode, error) => ({
  statusCode,
  body: JSON.stringify(error),
});

/**************** Lambda functions ********************************/

module.exports.connectHandler = async (event) => {
  console.log('Full $connect event:', JSON.stringify(event, null, 2));
  const token =
    event.headers?.Authorization?.split(' ')[1] ||
    event.queryStringParameters?.Auth;

  console.log('PEPEPEPEPPEEEEEEEEEEE', event.queryStringParameters);
  console.log('Token received:', token);
  console.log('Token received:', token);

  if (!token) {
    console.log('No token found');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const user = await module.exports.authorize(token);
  console.log('Decoded user:', user);

  if (!user) {
    console.log('Unauthorized connection attempt');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  console.log('User connected:', user.email);

  return {}; // Success
};

module.exports.disconnectHandler = async (event) => {
  console.log('OnDisconnect');
  console.log('Received event:', JSON.stringify(event, null, 2));

  return {};
};

module.exports.defaultHandler = async () => {
  return failedResponse(404, 'No event found');
};

module.exports.authorize = async (token) => {
  console.log('AUTHORIZE KÄYNNISSÖÄÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖ', token);
  if (!token) return null;

  try {
    return await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        { audience: process.env.USER_CLIENT_ID },
        (err, decoded) => {
          if (err) {
            console.error('JWT verification error:', err);
            reject(err);
          } else resolve(decoded);
        }
      );
    });
  } catch (err) {
    console.log('JWT verification failed', err);
    return null;
  }
};
module.exports.auth = async (event) => {
  const token = event.queryStringParameters?.Auth;
  const user = await module.exports.authorize(token);
  console.log('AUTHOEGHPEWHGHQEIGHEPGIHIEGHPIQEGHIEHQG', user, token);
  return {
    principalId: user.sub,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: event.methodArn,
        },
      ],
    },
    context: {
      username: user.email,
      sub: user.sub,
    },
  };
};

// Export responses in case other modules need them
module.exports.successfulResponse = successfulResponse;
module.exports.failedResponse = failedResponse;
